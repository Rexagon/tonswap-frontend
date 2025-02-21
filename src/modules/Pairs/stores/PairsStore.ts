import { makeAutoObservable } from 'mobx'

import { API_URL } from '@/constants'
import {
    DEFAULT_PAIRS_STORE_DATA,
    DEFAULT_PAIRS_STORE_STATE,
} from '@/modules/Pairs/constants'
import {
    PairsRequest,
    PairsResponse,
    PairsStoreData,
    PairsStoreState,
} from '@/modules/Pairs/types'


export class PairsStore {

    /**
     *
     * @protected
     */
    protected data: PairsStoreData = DEFAULT_PAIRS_STORE_DATA

    /**
     *
     * @protected
     */
    protected state: PairsStoreState = DEFAULT_PAIRS_STORE_STATE

    constructor() {
        makeAutoObservable(this)
    }

    /*
     * External actions for use it in UI
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     * @param {keyof PairsStoreData} key
     * @param {PairsStoreData[K]} value
     */
    public changeData<K extends keyof PairsStoreData>(key: K, value: PairsStoreData[K]): void {
        this.data[key] = value
    }

    /**
     *
     * @param {keyof PairsStoreState} key
     * @param {PairsStoreState[K]} value
     */
    public changeState<K extends keyof PairsStoreState>(key: K, value: PairsStoreState[K]): void {
        this.state[key] = value
    }

    /**
     *
     */
    public dispose(): void {
        this.data = DEFAULT_PAIRS_STORE_DATA
        this.state = DEFAULT_PAIRS_STORE_STATE
    }

    /**
     *
     */
    public async load(): Promise<void> {
        if (this.isLoading) {
            return
        }

        this.changeState('isLoading', true)

        const body: PairsRequest = {
            limit: this.limit,
            offset: this.currentPage >= 1 ? (this.currentPage - 1) * this.limit : 0,
            ordering: this.ordering,
        }
        const response = await fetch(`${API_URL}/pairs`, {
            body: JSON.stringify(body),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        })

        if (response.ok) {
            const result: PairsResponse = await response.json()
            this.changeData('pairs', result.pairs)
            this.changeData('totalCount', result.totalCount)
        }

        this.changeState('isLoading', false)
    }

    /*
     * Memoized store data values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get pairs(): PairsStoreData['pairs'] {
        return this.data.pairs
    }

    /*
     * Computed values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get totalPages(): number {
        return Math.ceil(this.data.totalCount / this.limit)
    }

    /*
     * Memoized store state values
     * ----------------------------------------------------------------------------------
     */

    /**
     *
     */
    public get currentPage(): PairsStoreState['currentPage'] {
        return this.state.currentPage
    }

    /**
     *
     */
    public get limit(): PairsStoreState['limit'] {
        return this.state.limit
    }

    /**
     *
     */
    public get isLoading(): PairsStoreState['isLoading'] {
        return this.state.isLoading
    }

    /**
     *
     */
    public get ordering(): PairsStoreState['ordering'] {
        return this.state.ordering
    }

}


const Pairs = new PairsStore()

export function usePairsStore(): PairsStore {
    return Pairs
}
