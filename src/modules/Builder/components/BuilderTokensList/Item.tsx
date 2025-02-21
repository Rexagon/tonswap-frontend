import * as React from 'react'
import { Link } from 'react-router-dom'

import { Token } from '@/modules/Builder/types'


type Props = {
    token: Token;
}

export function Item({ token }: Props): JSX.Element {
    return (
        <Link to={`/builder/${token.root}`} className="list__row list__row--pointer">
            <div className="list__cell list__cell--center">
                {token.name}
            </div>
            <div className="list__cell list__cell--center">
                {token.symbol}
            </div>
            <div className="list__cell list__cell--center">
                {token.decimals}
            </div>
            <div className="list__cell list__cell--center">
                {token.total_supply}
            </div>
        </Link>
    )
}
