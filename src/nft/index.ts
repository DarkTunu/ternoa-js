import BN from "bn.js"
import { IKeyringPair, ISubmittableResult } from "@polkadot/types/types"
import { isValidAddress, query, runTx, unFormatBalance } from "../blockchain"
import { chainQuery, txActions, txPallets } from "../constants"
import { getBalance } from "../balance"

/**
 * @name getNftMintFee
 * @summary Get the amount of caps needed to mint an NFT.
 * @returns Nft mint fee
 */
export const getNftMintFee = async () => {
  const fee: any = await query(txPallets.nft, chainQuery.nftMintFee)
  return fee as BN
}

/**
 * @name checkBalanceToMintNft
 * @summary Checks if an account as enough funds to support the Nft mint fee.
 * @param address Public address of the account to check balance to mint an Nft
 */
export const checkBalanceToMintNft = async (address: string) => {
  const balance = await getBalance(address)
  const nftMintFee = await getNftMintFee()
  if (balance.cmp(nftMintFee) === -1) throw new Error("Insufficient funds to mint an Nft")
}

/**
 * @name getNftDatas
 * @summary Gets the Nft datas if an nftid is provided otherwise, get all Nfts datas.
 * @param nftId The Nft id
 * @returns A JSON object with the nft datas or all nfts datas. ex:{owner, creator, offchainData, (...)}
 */
export const getNftDatas = async (nftId?: number) => {
  const nftDatas = await query(txPallets.nft, chainQuery.nfTs, [nftId])
  return nftDatas //.toJSON() : To Be Confirmed if we retrun it with toJSON or not
}
/**
 * @name compareDatas
 * @summary Compares the current value of a extrinsic attribute to the new one to avoid running a transaction if they are equal.
 * @param datas Current values to be compared
 * @param attribute Attribute of the element to compare (ex: nft.royalty, marketplace.commission_fee)
 * @param value New value to be compared to current datas
 */
export const compareDatas = async (datas: any, attribute: string, value: any) => {
  if (value != (null || undefined) && datas[attribute] === value)
    throw new Error(`The ${attribute.replace(/_/g, " ")} of the Nft is already set to : ${value}`)
}

/**
 * @name formatRoyalty
 * @summary Checks that royalty is in range 0 to 100 and format to permill.
 * @param royalty Number in range from 0 to 100 with max 4 decimals
 * @returns the royalty in permill format
 */
export const formatRoyalty = async (royalty: number) => {
  if (royalty > 100) throw new Error("The royalty must be set between 0.0000% and 100%")
  const royaltyFixed = (parseFloat(royalty.toFixed(4)) * 100) / 100
  return royaltyFixed
}

/**
 * @name createNft
 * @summary  Create a new Nft on blockchain with the provided details.
 * @param creator Public address of the account to check balance to mint Nft
 * @param offchainData Any offchain datas to add to the Nft (ex: a link, ipfs datas, a text)
 * @param royalty Royalty can be set from 0% to 100%
 * @param isSoulbound Boolean that lock transfert after creation
 * @param collectionId The collection id to which the Nft will belong
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const createNft = async (
  creator: string,
  offchainData: string, //Max 150 characters ?? File upload ?? nftOffchainDataLimit in consts from polka UI says 50 ?
  royalty: number, // % en permill
  isSoulbound: boolean,
  collectionId?: number, // ou strinfgstring, //ou number,
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  await checkBalanceToMintNft(creator)
  const formatedRoyalty = await formatRoyalty(royalty)
  const tx = await runTx(
    txPallets.nft,
    txActions.createNft,
    [offchainData, formatedRoyalty, isSoulbound, collectionId],
    keyring,
    callback,
  )
  return tx
}

/**
 * @name burnNft
 * @summary Remove an NFT from the storage.
 * @param nftId The id of the Nft that need to be burned from the storage.
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const burnNft = async (
  nftId: number,
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  //await checkOwner ??
  const tx = await runTx(txPallets.nft, txActions.burnNft, [nftId], keyring, callback)
  return tx
}

/**
 * @name delegateNft
 * @summary Delegate an NFT to a recipient (does not change ownership).
 * @param nftId The id of the Nft that need to be burned from the storage
 * @param recipient Address that will received the use of the Nft
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const delegateNft = async (
  nftId: number,
  recipient?: string, // optionnal according to the Polkadot UI ??
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  //await checkOwner ??
  //only one delegate ??
  //optionnal recipient according to the Polkadot UI ??
  if (recipient && !isValidAddress(recipient)) throw new Error("Invalid address format") // check if isValidAddress usefull or not??
  const tx = await runTx(txPallets.nft, txActions.delegateNft, [nftId, recipient], keyring, callback)
  return tx
}

/**
 * @name transferNft
 * @summary Transfer an NFT from an account to another one.
 * @param nftId The id of the Nft that need to be burned from the storage
 * @param recipient Address that will received the use of the Nft
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const transferNft = async (
  nftId: number,
  recipient: string,
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  //await checkOwner ??
  if (recipient && !isValidAddress(recipient)) throw new Error("Invalid address format")
  const tx = await runTx(txPallets.nft, txActions.transferNft, [nftId, recipient], keyring, callback)
  return tx
}

/**
 * @name setRoyalty
 * @summary Set the royalty of an NFT.
 * @param nftId The id of the Nft that need to be burned from the storage
 * @param royalty Number in range from 0 to 100 with max 4 decimals
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const setRoyalty = async (
  nftId: number,
  royalty: number, // % en permill
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  //await checkOwner ??
  //formatRoyalty ??
  const nftDatas: any = await getNftDatas(nftId) // nftDatas with : any type ?
  if (!nftDatas) throw new Error(`Cannot retrieve the datas for Nft with id : ${nftId}`)
  await compareDatas(nftDatas, "royalty", royalty)
  const tx = await runTx(txPallets.nft, txActions.setRoyalty, [nftId, royalty], keyring, callback)
  return tx
}

/**
 * @name setNftMintFee
 * @summary Set the fee for minting an Nft.
 * @param fee New fee to mint an Nft
 * @param keyring Keyring pair to sign the data
 * @param callback Callback function to enable subscription, if not given, no subscription will be made
 * @returns Hash of the transaction, or an unsigned transaction to be signed if no keyring pair is passed
 */
export const setNftMintFee = async (
  fee: number | BN,
  keyring?: IKeyringPair,
  callback?: (result: ISubmittableResult) => void,
) => {
  const formatedFee = typeof fee === "number" ? await unFormatBalance(fee) : fee
  const tx = await runTx(txPallets.nft, txActions.setNftMintFee, [formatedFee], keyring, callback)
  return tx
}
