import BigNumber from 'bignumber.js'
import { action, makeAutoObservable } from 'mobx'
import ton, { Address } from 'ton-inpage-provider'

import { Farm, TokenWallet } from '@/misc'
import {
    DEFAULT_FARMING_POOL_STORE_DATA,
    DEFAULT_FARMING_POOL_STORE_STATE,
} from '@/modules/Farming/constants'
import { FarmingStore, useFarmingStore } from '@/modules/Farming/stores/FarmingStore'
import {
    FarmingPoolStoreData,
    FarmingPoolStoreState,
    FarmPool,
} from '@/modules/Farming/types'
import { depositToken, withdrawUnclaimed } from '@/modules/Farming/utils'
import { useWallet, WalletService } from '@/stores/WalletService'
import { error } from '@/utils'


export class FarmingPoolStore {

    /**
     *
     * @protected
     */
    protected data: FarmingPoolStoreData = DEFAULT_FARMING_POOL_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: FarmingPoolStoreState = DEFAULT_FARMING_POOL_STORE_STATE

    /**
     *
     * @protected
     */
    protected poolUpdateTimeout: ReturnType<typeof setTimeout> | undefined

    constructor(
        protected pool: FarmPool,
        protected pools: FarmingStore,
        protected wallet: WalletService,
    ) {
        makeAutoObservable(this, {
            adminDepositToken: action.bound,
            adminWithdrawUnclaimed: action.bound,
            depositToken: action.bound,
            maxDeposit: action.bound,
            withdrawUnclaimed: action.bound,
        })
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param key
     * @param value
     */
    public changeData<K extends keyof FarmingPoolStoreData>(key: K, value: FarmingPoolStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     */
    public async init(): Promise<void> {
        if (this.wallet.address != null) {
            try {
                await this.updateWalletBalances(this.isAdmin, this.wallet.address)
                await this.syncPool()
                this.updatePoolTimeTick()
            }
            catch (e) {}
        }
    }

    /**
     *
     */
    public dispose(): void {
        if (this.poolUpdateTimeout !== undefined) {
            clearTimeout(this.poolUpdateTimeout)
            this.poolUpdateTimeout = undefined
        }
    }

    /**
     *
     */
    public maxDeposit(): void {
        this.changeData(
            'userDeposit',
            new BigNumber(this.userWalletBalance || '0')
                .shiftedBy(-this.pool.tokenDecimals)
                .decimalPlaces(this.pool.tokenDecimals, BigNumber.ROUND_DOWN)
                .toFixed(),
        )
    }

    /**
     *
     */
    public async depositToken(): Promise<void> {
        if (
            this.wallet.address == null
            || this.isUserDepositing
            || this.userDeposit == null
            || this.userWalletAddress == null
        ) {
            return
        }

        this.changeState('isUserDepositing', true)

        try {
            const result = await depositToken(
                this.userDeposit,
                this.pool.tokenDecimals,
                this.pool.address,
                this.pool.tokenRoot,
                this.userWalletAddress,
                this.wallet.address,
            )

            if (result == null) {
                return
            }

            if (this.poolUpdateTimeout != null) {
                clearTimeout(this.poolUpdateTimeout)
                this.poolUpdateTimeout = undefined
            }

            this.changeData('userWalletBalance', result.newUserBalance)
            this.changeData('userDeposit', undefined)
            await this.syncPool()
        }
        catch (e) {
            error('Token deposit error', e)
        }
        finally {
            this.changeState('isUserDepositing', false)
        }
    }

    /**
     *
     */
    public async withdrawUnclaimed(): Promise<void> {
        if (
            this.wallet.address == null
            || this.isUserDepositing
            || this.userWalletAddress == null
        ) { return }

        this.changeState('isUserDepositing', true)

        try {
            const result = await withdrawUnclaimed(
                this.pool.address,
                this.wallet.address,
                this.userWalletAddress,
            )

            if (result == null) {
                return
            }

            if (this.poolUpdateTimeout !== undefined) {
                clearTimeout(this.poolUpdateTimeout)
                this.poolUpdateTimeout = undefined
            }

            this.changeData('userWalletBalance', result)
            await this.syncPool()
            this.updatePoolTimeTick()
        }
        catch (e) {
            error('Withdraw unclaimed error', e)
        }
        finally {
            this.changeState('isUserDepositing', false)
        }
    }

    /**
     *
     * @param idx
     */
    public async adminDepositToken(idx: number): Promise<void> {
        if (this.isAdminDepositing) { return }

        const deposit = new BigNumber(this.adminDeposit[idx] || '0')
            .shiftedBy(this.pool.rewardTokenDecimals[idx])
            .decimalPlaces(0)

        if (
            !deposit.isFinite()
            || !deposit.isPositive()
            || deposit.isZero()
            || this.wallet.address == null
        ) {
            return
        }

        this.changeState('isAdminDepositing', true)

        const poolWallet = await TokenWallet.walletAddress({
            root: new Address(this.pool.rewardTokenRoot[idx]),
            owner: new Address(this.pool.address),
        })
        const poolWalletState = (await ton.getFullContractState({ address: poolWallet })).state

        if (poolWalletState === undefined || !poolWalletState.isDeployed) {
            this.changeState('isAdminDepositing', false)
            return
        }

        await TokenWallet.send({
            address: new Address(this.pool.rewardTokenRoot[idx]),
            owner: new Address(this.wallet.address),
            recipient: poolWallet,
            tokens: deposit.toFixed(),
            withDerive: true,
        })
        const poolBalance = this.pool.rewardTokenBalance
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // eslint-disable-next-line no-await-in-loop
            const newBalance = await TokenWallet.balance({ wallet: poolWallet })
            if (!(new BigNumber(newBalance).eq(poolBalance[idx]))) {
                const rewardTokenBalance = this.pool.rewardTokenBalance.slice()
                rewardTokenBalance[idx] = newBalance
                this.pools.updatePool(this.pool.tokenRoot, {
                    rewardTokenBalance,
                })
                const adminDeposit = this.adminDeposit.slice()
                adminDeposit[idx] = undefined
                this.changeData('adminDeposit', adminDeposit)
                this.changeState('isAdminDepositing', false)
            }
        }
    }

    /**
     *
     */
    public async adminWithdrawUnclaimed(): Promise<void> {
        if (this.wallet.address == null) {
            return
        }

        this.changeState('isAdminWithdrawUnclaiming', true)

        try {
            await Farm.poolAdminWithdrawUnclaimed(
                new Address(this.pool.address),
                new Address(this.wallet.address),
            )
        }
        catch (e) {
            error('Admin withdraw unclaimed error', e)
        }
        finally {
            this.changeState('isAdminWithdrawUnclaiming', false)
        }
    }

    /*
     * Internal utilities methods
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param key
     * @param value
     * @protected
     */
    protected changeState<K extends keyof FarmingPoolStoreState>(key: K, value: FarmingPoolStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    protected getAdminDeposit(idx: number): string | undefined {
        const seconds = (this.pool.farmEnd - this.pool.farmStart) / 1000
        const reward = new BigNumber(this.pool.farmSpeed[idx]).multipliedBy(seconds)
        const depositAmount = reward
            .minus(this.pool.rewardTokenBalanceCumulative[idx])
            .shiftedBy(-this.pool.rewardTokenDecimals[idx])
            .decimalPlaces(this.pool.rewardTokenDecimals[idx], BigNumber.ROUND_UP)

        if (depositAmount.isFinite() && depositAmount.isPositive() && !depositAmount.isZero()) {
            return depositAmount.toFixed()
        }

        return undefined
    }

    /**
     *
     */
    protected async syncPool(): Promise<void> {
        const poolAddress = new Address(this.pool.address)
        const userDataAddress = new Address(this.pool.userDataAddress)
        const poolState = await ton.getFullContractState({ address: poolAddress })
        const poolBalance = await Farm.poolTokenBalance(poolAddress, poolState.state)
        const poolRewardBalance = await Farm.poolRewardTokenBalance(poolAddress, poolState.state)
        const poolRewardBalanceCumulative = await Farm.poolRewardTokenBalanceCumulative(poolAddress, poolState.state)
        let userBalance = '0',
            userRewardDebt: string[] = [],
            userDataDeployed = false

        try {
            const userData = await Farm.userDataAmountAndRewardDebt(userDataAddress)
            userBalance = userData.amount
            userRewardDebt = userData.rewardDebt
            userDataDeployed = true
        }
        catch (e) {}

        const userReward = await Farm.poolPendingReward(
            poolAddress,
            userBalance,
            userRewardDebt,
        )
        const share = poolBalance !== '0' ? new BigNumber(userBalance)
            .div(poolBalance)
            .multipliedBy('100')
            .shiftedBy(4)
            .decimalPlaces(0, BigNumber.ROUND_DOWN)
            .toFixed() : '0'

        this.pools.updatePool(this.pool.tokenRoot, {
            tokenBalance: poolBalance,
            rewardTokenBalance: poolRewardBalance,
            userBalance,
            userReward,
            userShare: share,
            userDataDeployed,
            rewardTokenBalanceCumulative: poolRewardBalanceCumulative,
        })
    }

    /**
     *
     */
    protected updatePoolTimeTick(): void {
        if (this.poolUpdateTimeout !== undefined) {
            clearTimeout(this.poolUpdateTimeout)
        }
        const localTimeout = setTimeout(async () => {
            if (localTimeout === this.poolUpdateTimeout) {
                await this.syncPool()
            }
            if (localTimeout === this.poolUpdateTimeout) {
                this.updatePoolTimeTick()
            }
        }, 5000)
        this.poolUpdateTimeout = localTimeout
    }

    /**
     *
     */
    protected async updateWalletBalances(isAdmin: boolean, accountAddress: string): Promise<void> {
        if (isAdmin) {
            if (this.adminWalletAddress.length === 0) {
                try {
                    const result = await Promise.all(
                        this.pool.rewardTokenRoot.map(
                            async address => (await TokenWallet.walletAddress({
                                owner: new Address(accountAddress),
                                root: new Address(address),
                            })).toString(),
                        ),
                    )
                    this.changeData('adminWalletAddress', result)
                }
                catch (e) {
                    error('Admin wallet address error', e)
                }
            }

            try {
                const result = await Promise.all(
                    this.adminWalletAddress.map(async address => {
                        try {
                            if (address != null) {
                                return await TokenWallet.balance({ wallet: new Address(address) })
                            }
                            return undefined
                        }
                        catch (e) {
                            return undefined
                        }
                    }),
                )
                this.changeData('adminWalletBalance', result)
            }
            catch (e) {
                error('Admin wallet balance error', e)
            }
        }

        if (this.userWalletAddress === undefined) {
            try {
                const result = await TokenWallet.walletAddress({
                    owner: new Address(accountAddress),
                    root: new Address(this.pool.tokenRoot),
                })
                this.changeData('userWalletAddress', result.toString())
            }
            catch (e) {
                error('User wallet balance error', e)
            }
        }

        if (this.userWalletAddress !== undefined) {
            try {
                const balance = await TokenWallet.balance({
                    wallet: new Address(this.userWalletAddress),
                })
                this.changeData('userWalletBalance', balance)
            }
            catch (e) {
                this.changeData('userWalletBalance', undefined)
            }
        }

        this.changeData('adminDeposit', this.adminWalletAddress.map(
            (_, idx) => this.getAdminDeposit(idx),
        ))
    }

    /*
     * Computed states
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isAdmin(): boolean {
        return this.wallet.address != null && this.pool.owner === this.wallet.address
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get adminDeposit(): FarmingPoolStoreData['adminDeposit'] {
        return this.data.adminDeposit
    }

    /**
     *
     */
    public get adminWalletAddress(): FarmingPoolStoreData['adminWalletAddress'] {
        return this.data.adminWalletAddress
    }

    /**
     *
     */
    public get adminWalletBalance(): FarmingPoolStoreData['adminWalletBalance'] {
        return this.data.adminWalletBalance
    }

    /**
     *
     */
    public get userDeposit(): FarmingPoolStoreData['userDeposit'] {
        return this.data.userDeposit
    }

    /**
     *
     */
    public get userWalletAddress(): FarmingPoolStoreData['userWalletAddress'] {
        return this.data.userWalletAddress
    }

    /**
     *
     */
    public get userWalletBalance(): FarmingPoolStoreData['userWalletBalance'] {
        return this.data.userWalletBalance
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get isAdminDepositing(): FarmingPoolStoreState['isAdminDepositing'] {
        return this.state.isAdminDepositing
    }

    /**
     *
     */
    public get isAdminWithdrawUnclaiming(): FarmingPoolStoreState['isAdminWithdrawUnclaiming'] {
        return this.state.isAdminWithdrawUnclaiming
    }

    /**
     *
     */
    public get isUserDepositing(): FarmingPoolStoreState['isUserDepositing'] {
        return this.state.isUserDepositing
    }

}

export function useFarmingPool(pool: FarmPool): FarmingPoolStore {
    return new FarmingPoolStore(pool, useFarmingStore(), useWallet())
}
