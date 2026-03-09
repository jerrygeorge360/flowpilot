import FlowPilotVault from "../contracts/FlowPilotVault.cdc"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    let vaultRef = account.capabilities.borrow<&FlowPilotVault.Vault>(FlowPilotVault.VaultPublicPath)
        ?? panic("No vault")

    return vaultRef.getBalanceWithYield()
}
