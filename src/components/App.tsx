import * as React from 'react'
import { IntlProvider } from 'react-intl'
import {
    BrowserRouter as Router,
    Switch,
    Redirect,
    Route,
} from 'react-router-dom'

import { WalletConnectingModal } from '@/components/common/WalletConnectingModal'
import { WalletUpdateModal } from '@/components/common/WalletUpdateModal'
import { Header } from '@/components/layout/Header'
import messages from '@/lang/en'
import { Account } from '@/modules/Account'
import Builder from '@/pages/builder'
import CreateToken from '@/pages/builder/create'
import Farming from '@/pages/farming'
import CreateFarmPool from '@/pages/farming/create'
import Pairs from '@/pages/pairs'
import Pair from '@/pages/pairs/item'
import Pool from '@/pages/pool'
import Swap from '@/pages/swap'
import Tokens from '@/pages/tokens'
import Token from '@/pages/tokens/item'
import { noop } from '@/utils'

import './App.scss'
import { ManageToken } from '@/modules/Builder/manageToken'


export function App(): JSX.Element {
    return (
        <IntlProvider
            key="intl"
            locale="en"
            defaultLocale="en"
            messages={messages}
            onError={noop}
        >
            <Router>
                <div className="wrapper">
                    <Header key="header" />
                    <main className="main">
                        <Switch>
                            <Route exact path="/">
                                <Redirect exact to="/swap" />
                            </Route>
                            <Route path="/swap/:leftTokenAddress([0][:][0-9a-f]{64})?/:rightTokenAddress([0][:][0-9a-f]{64})?">
                                <Swap />
                            </Route>
                            <Route exact path="/pool/:leftTokenAddress([0][:][0-9a-f]{64})?/:rightTokenAddress([0][:][0-9a-f]{64})?">
                                <Pool />
                            </Route>
                            <Route exact path="/farming">
                                <Farming />
                            </Route>
                            <Route exact path="/farming/create">
                                <CreateFarmPool />
                            </Route>
                            <Route exact path="/tokens">
                                <Tokens />
                            </Route>
                            <Route exact path="/tokens/:address">
                                <Token />
                            </Route>
                            <Route exact path="/pairs">
                                <Pairs />
                            </Route>
                            <Route exact path="/pairs/:poolAddress">
                                <Pair />
                            </Route>
                            <Route exact path="/builder">
                                <Builder />
                            </Route>
                            <Route path="/builder/create">
                                <CreateToken />
                            </Route>
                            <Route exact path="/builder/:tokenRoot">
                                <ManageToken />
                            </Route>
                        </Switch>
                    </main>
                    <Account key="account" />
                    <WalletConnectingModal />
                    <WalletUpdateModal />
                </div>
            </Router>
        </IntlProvider>
    )
}
