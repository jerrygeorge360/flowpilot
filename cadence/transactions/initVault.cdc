import FlowPilotVault from "FlowPilotVault"

transaction {
    prepare(signer: auth(SaveValue, LoadValue, BorrowValue, Capabilities, IssueStorageCapabilityController, PublishCapability, UnpublishCapability) &Account) {
        // IMPORTANT: do not typed-borrow first; old contract type at same path will panic.
        if signer.storage.borrow<&AnyResource>(from: FlowPilotVault.VaultStoragePath) != nil {
            let existing <- signer.storage.load<@AnyResource>(from: FlowPilotVault.VaultStoragePath)
                ?? panic("Failed to load existing vault resource")

            // Correct type already initialized
            if let currentVault <- existing as? @FlowPilotVault.Vault {
                signer.storage.save(<-currentVault, to: FlowPilotVault.VaultStoragePath)
                return
            }

            // Legacy/incompatible vault at same path; clear it.
            destroy existing
        }

        // Create new vault
        let vault <- FlowPilotVault.createVault(owner: signer.address)
        
        // Save to storage
        signer.storage.save(<-vault, to: FlowPilotVault.VaultStoragePath)

        // Replace stale public capability from legacy contract type if present
        let _ = signer.capabilities.unpublish(FlowPilotVault.VaultPublicPath)
        
        // Create public capability
        let cap = signer.capabilities.storage.issue<&FlowPilotVault.Vault>(FlowPilotVault.VaultStoragePath)
        signer.capabilities.publish(cap, at: FlowPilotVault.VaultPublicPath)
    }
}
