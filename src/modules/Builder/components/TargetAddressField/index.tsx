import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { useMintForm } from '@/modules/Builder/hooks/useMintForm'
import { BuilderField } from '@/modules/Builder/components/BuilderField'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'

function Field(): JSX.Element {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(tokenRoot)
    const mintForm = useMintForm()

    const handleChange = (targetAddress: string): void => {
        mintForm.onChangeData('targetAddress')(targetAddress)

        mintForm.debouncedLoadTargetWalletBalance()
    }

    return (
        <BuilderField
            disabled={managingToken.isMinting}
            label={intl.formatMessage({ id: 'BUILDER_MANAGE_TOKEN_MINT_LABEL_TARGET_ADDRESS' })}
            type="string"
            isValid={
                managingToken.targetAddress.length > 0
            }
            value={managingToken.targetAddress}
            onChange={handleChange}
        />
    )
}

export const TargetAddressField = observer(Field)
