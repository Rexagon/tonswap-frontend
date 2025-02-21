import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import ton, { Address, Contract } from 'ton-inpage-provider'

import { Farm, FarmAbi, TokenWallet } from '@/misc'


export async function loadUniWTON(): Promise<BigNumber> {
    const body = {
        operationName: 'pairs',
        variables: { allPairs: ['0x5811ec00d774de2c72a51509257d50d1305358aa'] },
        query: 'fragment PairFields on Pair {\n  id\n  txCount\n  token0 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  token1 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  reserve0\n  reserve1\n  reserveUSD\n  totalSupply\n  trackedReserveETH\n  reserveETH\n  volumeUSD\n  untrackedVolumeUSD\n  token0Price\n  token1Price\n  createdAtTimestamp\n  __typename\n}\n\nquery pairs($allPairs: [Bytes]!) {\n  pairs(first: 500, where: {id_in: $allPairs}, orderBy: trackedReserveETH, orderDirection: desc) {\n    ...PairFields\n    __typename\n  }\n}\n',
    }
    const result: any = await fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2', {
        body: JSON.stringify(body),
        method: 'POST',
    }).then(res => res.json())
    return new BigNumber(result.data.pairs[0].reserve1).multipliedBy(2).shiftedBy(9).decimalPlaces(0)
}

export function filterEmpty<TValue>(
    value: TValue | undefined | null,
): value is TValue {
    return value !== undefined && value !== null
}

export function parseDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined
    }
    const parsedDate = DateTime.fromFormat(value, 'yyyy/MM/dd HH:mm')
    if (parsedDate.isValid) {
        return parsedDate.toJSDate()
    }
    return undefined
}

export function farmSpeed(
    dateStart: Date,
    dateEnd: Date,
    rewardTotal: BigNumber | undefined,
    rewardDecimals: number | undefined,
): BigNumber {
    if (rewardTotal === undefined || rewardDecimals === undefined) {
        return new BigNumber(0)
    }
    const seconds = (dateEnd.getTime() - dateStart.getTime()) / 1000
    return rewardTotal
        .shiftedBy(rewardDecimals)
        .decimalPlaces(0)
        .div(seconds)
        .shiftedBy(-rewardDecimals)
        .decimalPlaces(rewardDecimals, BigNumber.ROUND_DOWN)
}

export function farmDeposit(
    dateStart: Date,
    dateEnd: Date,
    rewardTotal: BigNumber | undefined,
    rewardDecimals: number | undefined,
): BigNumber {
    if (rewardTotal === undefined || rewardDecimals === undefined) {
        return new BigNumber(0)
    }
    const speed = farmSpeed(dateStart, dateEnd, rewardTotal, rewardDecimals)
    const seconds = (dateEnd.getTime() - dateStart.getTime()) / 1000
    return speed.multipliedBy(seconds).decimalPlaces(rewardDecimals, BigNumber.ROUND_UP)
}

export async function resolveToken(
    address: string | undefined,
): Promise<{symbol: string, decimals: number} | undefined> {
    try {
        const rootAddress = new Address(address || '')
        const { state } = await ton.getFullContractState({ address: rootAddress })

        if (state === undefined) { return undefined }
        if (!state.isDeployed) { return undefined }

        const symbol = await TokenWallet.symbol(rootAddress, state)
        const decimals = parseInt(await TokenWallet.decimal(rootAddress, state), 10)

        return { symbol, decimals }
    }
    catch (e) {
        return undefined
    }
}

export function isDepositValid(
    amount: string | undefined,
    walletBalance: string | undefined,
    decimals: number,
): boolean {
    const amountBN = new BigNumber(amount || '0')
    const walletBN = new BigNumber(walletBalance || '0')
    const balanceValid = amountBN
        .shiftedBy(decimals)
        .decimalPlaces(0)
        .lte(walletBN)
    return balanceValid && !walletBN.isZero() && !amountBN.isZero()
}

export async function depositToken(
    depositAmount: string,
    depositDecimals: number,
    poolAddress: string,
    rootAddress: string,
    userWalletAddress: string,
    accountAddress: string,
): Promise<{ newUserBalance: string, newPoolBalance: string } | undefined> {
    const deposit = new BigNumber(depositAmount)
        .shiftedBy(depositDecimals)
        .decimalPlaces(0)

    if (!deposit.isFinite() || !deposit.isPositive() || deposit.isZero()) {
        return undefined
    }

    const poolWallet = await TokenWallet.walletAddress({
        root: new Address(rootAddress),
        owner: new Address(poolAddress),
    })
    const poolWalletState = (await ton.getFullContractState({ address: poolWallet })).state
    if (poolWalletState === undefined || !poolWalletState.isDeployed) {
        return undefined
    }
    const poolContract = new Contract(FarmAbi.Pool, new Address(poolAddress))
    let resolve: () => void | undefined
    const promise = new Promise<void>(r => {
        resolve = () => r()
    })
    const subscription = (
        await ton.subscribe('transactionsFound', {
            address: new Address(poolAddress),
        })
    ).on('data', txs => {
        txs.transactions.forEach(tx => {
            poolContract.decodeTransactionEvents({
                transaction: tx,
            }).then(events => {
                events.forEach(event => {
                    if (event.event === 'Deposit') {
                        if (event.data.user.toString() === accountAddress) {
                            resolve()
                        }
                    }
                })
            })
        })
    })

    try {
        await TokenWallet.send({
            address: new Address(userWalletAddress),
            owner: new Address(accountAddress),
            recipient: poolWallet,
            tokens: deposit.toFixed(),
            grams: '5000000000',
        })
    }
    catch (e) {
        await subscription.unsubscribe()
        throw e
    }

    await promise
    await subscription.unsubscribe()
    const newUserBalance = await TokenWallet.balance({ wallet: new Address(userWalletAddress) })
    const userDataAddress = await Farm.userDataAddress(
        new Address(poolAddress),
        new Address(accountAddress),
    )
    let newPoolBalance = '0'
    try {
        const { amount } = await Farm.userDataAmountAndRewardDebt(userDataAddress)
        newPoolBalance = amount
    }
    catch (e) {}
    return { newUserBalance, newPoolBalance }
}

export function isWithdrawUnclaimedValid(userReward: (string | undefined)[], userBalance: string | undefined): boolean {
    return (
        userReward.map(a => (new BigNumber(a || '0').isZero())).findIndex(a => !a) >= 0
        || !(new BigNumber(userBalance || '0').isZero())
    )
}

export async function withdrawUnclaimed(
    poolAddress: string,
    accountAddress: string,
    userWalletAddress: string,
): Promise<string> {
    const poolContract = new Contract(FarmAbi.Pool, new Address(poolAddress))
    let resolve: () => void | undefined
    const promise = new Promise<void>(r => {
        resolve = () => r()
    })
    const subscription = (await ton.subscribe('transactionsFound', {
        address: new Address(poolAddress),
    })).on('data', txs => {
        txs.transactions.forEach(tx => {
            poolContract.decodeTransactionEvents({
                transaction: tx,
            }).then(events => {
                events.forEach(event => {
                    if (event.event === 'Withdraw') {
                        if (event.data.user.toString() === accountAddress) {
                            resolve()
                        }
                    }
                })
            })
        })
    })

    try {
        await Farm.poolWithdrawUnclaimed(new Address(poolAddress), new Address(accountAddress))
    }
    catch (e) {
        await subscription.unsubscribe()
        throw e
    }

    await promise
    await subscription.unsubscribe()
    // eslint-disable-next-line no-return-await
    return await TokenWallet.balance({ wallet: new Address(userWalletAddress) })
}
