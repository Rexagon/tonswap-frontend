import { UTCTimestamp } from 'lightweight-charts'
import { DateTime } from 'luxon'
import {
    IReactionDisposer,
    action,
    makeAutoObservable,
    reaction,
} from 'mobx'
import uniqBy from 'lodash.uniqby'

import { API_URL } from '@/constants'
import {
    CandlestickGraphShape,
    CommonGraphShape,
    OhlcvGraphModel,
    TvlGraphModel,
    VolumeGraphModel,
} from '@/modules/Chart/types'
import {
    DEFAULT_PAIR_STORE_DATA,
    DEFAULT_PAIR_STORE_STATE,
} from '@/modules/Pairs/constants'
import {
    PairGraphRequest,
    PairResponse,
    PairStoreData,
    PairStoreGraphData,
    PairStoreState,
} from '@/modules/Pairs/types'
import {
    TransactionsInfoResponse,
    TransactionsRequest,
} from '@/modules/Transactions/types'
import { parseCurrencyBillions } from '@/utils'


export class PairStore {

    /**
     *
     * @protected
     */
    protected data: PairStoreData = DEFAULT_PAIR_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: PairStoreState = DEFAULT_PAIR_STORE_STATE

    constructor(protected readonly address: string) {
        makeAutoObservable(this, {
            loadOhlcvGraph: action.bound,
            loadTvlGraph: action.bound,
            loadVolumeGraph: action.bound,
        })

        this.#timeframeDisposer = reaction(() => this.timeframe, () => {
            this.changeState('isOhlcvGraphLoading', false)
            this.changeState('isTvlGraphLoading', false)
            this.changeState('isVolumeGraphLoading', false)
            this.changeData('graphData', DEFAULT_PAIR_STORE_DATA.graphData)
        })
    }

    /**
     *
     * @param {keyof PairStoreData} key
     * @param {PairStoreData[K]} value
     */
    public changeData<K extends keyof PairStoreData>(key: K, value: PairStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     * @param {keyof PairStoreState} key
     * @param {PairStoreState[K]} value
     */
    public changeState<K extends keyof PairStoreState>(key: K, value: PairStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    public dispose(): void {
        this.#timeframeDisposer?.()
    }

    /**
     *
     * @param {keyof PairStoreGraphData} key
     * @param {PairStoreGraphData[K]} value
     * @protected
     */
    protected changeGraphData<K extends keyof PairStoreGraphData>(key: K, value: PairStoreGraphData[K]): void {
        this.data.graphData[key] = value
    }

    /**
     *
     */
    public get isLoading(): PairStoreState['isLoading'] {
        return this.state.isLoading
    }

    /**
     *
     */
    public async load(): Promise<void> {
        if (this.isLoading) {
            return
        }

        try {
            this.changeState('isLoading', true)

            const response = await fetch(`${API_URL}/pairs/address/${this.address}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: PairResponse = await response.json()
                this.changeData('pair', result)
            }
        }
        catch (e) {}
        finally {
            this.changeState('isLoading', false)
        }
    }

    /**
     *
     */
    public get pair(): PairStoreData['pair'] {
        return this.data.pair
    }

    /**
     *
     */
    public get formattedTvl(): string {
        return parseCurrencyBillions(this.pair?.tvl)
    }

    /**
     *
     */
    public get formattedVolume24h(): string {
        return parseCurrencyBillions(this.pair?.volume24h)
    }

    /**
     *
     */
    public get formattedFees24h(): string {
        return parseCurrencyBillions(this.pair?.fee24h)
    }

    /**
     *
     */
    public get isOhlcvGraphLoading(): PairStoreState['isOhlcvGraphLoading'] {
        return this.state.isOhlcvGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadOhlcvGraph(from?: number, to?: number): Promise<void> {
        if (this.isOhlcvGraphLoading) {
            return
        }

        try {
            this.changeState('isOhlcvGraphLoading', true)

            const body: PairGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }
            const response = await fetch(`${API_URL}/pairs/address/${this.address}/ohlcv`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: OhlcvGraphModel[] = await response.json()
                this.changeGraphData('ohlcv', result.concat(this.graphData.ohlcv))
            }
        }
        catch (e) {}
        finally {
            this.changeState('isOhlcvGraphLoading', false)
        }
    }

    /**
     *
     */
    public get isTvlGraphLoading(): PairStoreState['isTvlGraphLoading'] {
        return this.state.isTvlGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadTvlGraph(from?: number, to?: number): Promise<void> {
        if (this.isTvlGraphLoading) {
            return
        }

        try {
            this.changeState('isTvlGraphLoading', true)

            const body: PairGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }
            const response = await fetch(`${API_URL}/pairs/address/${this.address}/tvl`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: TvlGraphModel[] = await response.json()
                this.changeGraphData('tvl', result.concat(this.graphData.tvl))
            }
        }
        catch (e) {}
        finally {
            this.changeState('isTvlGraphLoading', false)
        }
    }

    /**
     *
     */
    public get isVolumeGraphLoading(): PairStoreState['isVolumeGraphLoading'] {
        return this.state.isVolumeGraphLoading
    }

    /**
     *
     * @param {number} [from]
     * @param {number} [to]
     */
    public async loadVolumeGraph(from?: number, to?: number): Promise<void> {
        if (this.isVolumeGraphLoading) {
            return
        }

        try {
            this.changeState('isVolumeGraphLoading', true)

            const body: PairGraphRequest = {
                from: from || DateTime.local().minus({
                    days: this.timeframe === 'D1' ? 30 : 7,
                }).toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
                timeframe: this.timeframe,
                to: to || DateTime.local().toUTC(undefined, {
                    keepLocalTime: false,
                }).toMillis(),
            }
            const response = await fetch(`${API_URL}/pairs/address/${this.address}/volume`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: VolumeGraphModel[] = await response.json()
                this.changeGraphData('volume', result.concat(this.graphData.volume))
            }
        }
        catch (e) {}
        finally {
            this.changeState('isVolumeGraphLoading', false)
        }
    }

    /**
     *
     */
    public get timeframe(): PairStoreState['timeframe'] {
        return this.state.timeframe
    }

    /**
     *
     */
    public get graph(): PairStoreState['graph'] {
        return this.state.graph
    }

    /**
     *
     */
    public get graphData(): PairStoreData['graphData'] {
        return this.data.graphData
    }

    /**
     *
     */
    public get ohlcvGraphData(): CandlestickGraphShape[] {
        return uniqBy(this.graphData.ohlcv, 'timestamp').map<CandlestickGraphShape>(item => ({
            close: item.close,
            high: item.high,
            low: item.low,
            open: item.open,
            time: (item.timestamp / 1000) as UTCTimestamp,
        }))
    }

    /**
     *
     */
    public get ohlcvGraphInverseData(): CandlestickGraphShape[] {
        return this.ohlcvGraphData.map<CandlestickGraphShape>(item => ({
            ...item,
            close: item.open,
            high: item.low,
            low: item.high,
            open: item.close,
        }))
    }

    /**
     *
     */
    public get volumeGraphData(): CommonGraphShape[] {
        return uniqBy(this.graphData.volume, 'timestamp').map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as UTCTimestamp,
            value: item.data,
        }))
    }

    /**
     *
     */
    public get tvlGraphData(): CommonGraphShape[] {
        return uniqBy(this.graphData.tvl, 'timestamp').map<CommonGraphShape>(item => ({
            time: (item.timestamp / 1000) as UTCTimestamp,
            value: item.data,
        }))
    }

    /**
     *
     */
    public get isTransactionsLoading(): PairStoreState['isTransactionsLoading'] {
        return this.state.isTransactionsLoading
    }

    /**
     *
     */
    public async loadTransactions(): Promise<void> {
        if (this.isTransactionsLoading) {
            return
        }

        try {
            this.changeState('isTransactionsLoading', true)

            const body: TransactionsRequest = {
                limit: this.transactionsLimit,
                offset: this.transactionsCurrentPage >= 1
                    ? (this.transactionsCurrentPage - 1) * this.transactionsLimit
                    : 0,
                ordering: this.transactionsOrdering,
                poolAddress: this.address,
            }
            if (this.transactionsEvents.length > 0) {
                body.eventType = this.transactionsEvents
            }
            const response = await fetch(`${API_URL}/transactions`, {
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                mode: 'cors',
            })

            if (response.ok) {
                const result: TransactionsInfoResponse = await response.json()
                this.changeData('transactionsData', result)
            }
        }
        catch (e) {}
        finally {
            this.changeState('isTransactionsLoading', false)
        }
    }

    /**
     *
     */
    public get transactions(): PairStoreData['transactionsData']['transactions'] {
        return this.data.transactionsData.transactions
    }

    /**
     *
     */
    public get transactionsCurrentPage(): PairStoreState['transactionsCurrentPage'] {
        return this.state.transactionsCurrentPage
    }

    /**
     *
     */
    public get transactionsEvents(): PairStoreState['transactionsEventsType'] {
        return this.state.transactionsEventsType
    }

    /**
     *
     */
    public get transactionsLimit(): PairStoreState['transactionsLimit'] {
        return this.state.transactionsLimit
    }

    /**
     *
     */
    public get transactionsOrdering(): PairStoreState['transactionsOrdering'] {
        return this.state.transactionsOrdering
    }

    /**
     *
     */
    public get transactionsTotalPages(): PairStoreData['transactionsData']['totalCount'] {
        return Math.ceil(this.data.transactionsData.totalCount / this.transactionsLimit)
    }

    /*
     * Internal reaction disposers
     * ----------------------------------------------------------------------------------
     */

    #timeframeDisposer: IReactionDisposer | undefined

}
