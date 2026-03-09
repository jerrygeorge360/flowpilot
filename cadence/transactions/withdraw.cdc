import FlowPilotVault from "../contracts/FlowPilotVault.cdc"

transaction(amount: UFix64) {
    prepare(signer: auth(BorrowValue) &Account) {
        let vault = signer.storage.borrow<&FlowPilotVault.Vault>(from: FlowPilotVault.VaultStoragePath)
            ?? panic("No vault found. Please initialize first")
        let _ = vault.withdraw(amount: amount, owner: signer.address)
    }
}
