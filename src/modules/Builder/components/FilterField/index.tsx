import * as React from 'react'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { useFilterForm } from '@/modules/Builder/hooks/useFilterForm'

import './index.scss'


type Props = {
    className?: string;
}

export function FilterField({ className }: Props): JSX.Element {
    const intl = useIntl()
    const form = useFilterForm()

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        form.onChangeData('filter')(value)
        form.debouncedFilter()
    }

    return (
        <div className={classNames('filter-field', className)}>
            <input
                className="form-input"
                placeholder={intl.formatMessage({
                    id: 'BUILDER_SEARCH_FIELD_PLACEHOLDER',
                })}
                onChange={onChange}
            />
        </div>
    )
}
