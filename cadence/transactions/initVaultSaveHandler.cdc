import VaultSaveHandler from "../contracts/VaultSaveHandler.cdc"
import FlowTransactionScheduler from "../contracts/stubs/FlowTransactionScheduler.cdc"

transaction {
    prepare(signer: auth(SaveValue, Storage, Capabilities) &Account) {
        // Check and create handler if not already present
        if signer.storage.borrow<&AnyResource>(from: /storage/VaultSaveHandler) == nil {
            let handler <- VaultSaveHandler.createHandler()
            signer.storage.save(<-handler, to: /storage/VaultSaveHandler)
        }

        // Issue entitled capability (for Execute entitlement)
        let _ = signer.capabilities.storage
            .issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
                /storage/VaultSaveHandler
            )

        // Ensure public capability is published
        let existingPublicCap = signer.capabilities
            .get<&{FlowTransactionScheduler.TransactionHandler}>(/public/VaultSaveHandler)

        if !existingPublicCap.check() {
            let publicCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
                /storage/VaultSaveHandler
            )
            signer.capabilities.publish(publicCap, at: /public/VaultSaveHandler)
        }
    }
}
