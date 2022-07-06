import BN from "bn.js"
import { chainQuery, txPallets } from "../constants"
import { query, unFormatBalance } from "../blockchain"

/**
 * @name getBalances
 * @summary Get the balances of an account including free, reserved, miscFrozen and feeFrozen balances as well as the total.
 * @param address Public address of the account to get balances
 * @returns The balances of the account
 */
export const getBalances = async (address: string) => {
    const balances: { free: BN; reserved: BN; miscFrozen: BN; feeFrozen: BN } = (
        (await query(txPallets.system, chainQuery.account, [address])) as any
    ).data
    return balances
}

/**
 * @name getFreeBalance
 * @summary Get the free balance of an account
 * @param address Public address of the account to get free balance for
 * @returns The free balance of the account
 */
export const getFreeBalance = async (address: string) => {
    const balances = await getBalances(address)
    return balances.free
}

/**
 * @name checkBalanceForTransfer
 * @summary Check if an account as enough funds to ensure a transfer
 * @param address Public address of the account to check balance for transfer
 * @param value Token amount to transfer
 */
export const checkBalanceForTransfer = async (address: string, value: number | BN) => {
    if (value <= 0) throw new Error("Value needs to be greater than 0")

    const freeBalance = await getFreeBalance(address)
    const amount = typeof value === "number" ? await unFormatBalance(value) : value
    if (freeBalance.cmp(amount) === -1) throw new Error("Insufficient funds to transfer")
}