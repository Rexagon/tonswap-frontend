import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Pagination } from '@/components/common/Pagination'
import { PairsList } from '@/modules/Pairs/components/PairsList'
import { usePairsStore } from '@/modules/Pairs/stores/PairsStore'
import { PairsOrdering } from '@/modules/Pairs/types'


export function Pairs(): JSX.Element {
    const intl = useIntl()
    const store = usePairsStore()

    const onNextPage = async () => {
        if (store.currentPage < store.totalPages) {
            store.changeState('currentPage', store.currentPage + 1)
            await store.load()
        }
    }

    const onPrevPage = async () => {
        if (store.currentPage > 1) {
            store.changeState('currentPage', store.currentPage - 1)
            await store.load()
        }
    }

    const onChangePage = async (value: number) => {
        store.changeState('currentPage', value)
        await store.load()
    }

    const onSwitchOrdering = async (value: PairsOrdering) => {
        store.changeState('ordering', value)
        store.changeState('currentPage', 1)
        await store.load()
    }

    React.useEffect(() => {
        (async () => {
            await store.load()
        })()
        return () => {
            store.dispose()
        }
    }, [])

    return (
        <section className="section section--large">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'PAIRS_HEADER_TITLE',
                    })}
                </h2>
            </header>

            <div className="card card--small card--flat">
                <Observer>
                    {() => (
                        <>
                            <PairsList
                                pairs={store.pairs}
                                isLoading={store.isLoading}
                                offset={store.limit * (store.currentPage - 1)}
                                ordering={store.ordering}
                                onSwitchOrdering={onSwitchOrdering}
                            />

                            <Pagination
                                currentPage={store.currentPage}
                                disabled={store.isLoading}
                                totalPages={store.totalPages}
                                onNext={onNextPage}
                                onPrev={onPrevPage}
                                onSubmit={onChangePage}
                            />
                        </>
                    )}
                </Observer>
            </div>
        </section>
    )
}
