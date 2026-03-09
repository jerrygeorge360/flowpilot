import FlowTransactionScheduler from "FlowTransactionScheduler"
import FlowToken from "FlowToken"

access(all) contract FlowTransactionSchedulerUtils {
    access(all) entitlement Owner

    access(all) let managerStoragePath: StoragePath
    access(all) let managerPublicPath: PublicPath

    access(all) resource interface Manager {
        access(Owner) fun schedule(
            handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>,
            data: AnyStruct?,
            timestamp: UFix64,
            priority: FlowTransactionScheduler.Priority,
            executionEffort: UInt64,
            fees: @FlowToken.Vault
        ): UInt64

        access(Owner) fun scheduleByHandler(
            handlerTypeIdentifier: String,
            handlerUUID: UInt64?,
            data: AnyStruct?,
            timestamp: UFix64,
            priority: FlowTransactionScheduler.Priority,
            executionEffort: UInt64,
            fees: @FlowToken.Vault
        ): UInt64
        
        access(Owner) fun cancel(id: UInt64): @FlowToken.Vault
    }

    access(all) resource ManagerImpl: Manager {
        access(Owner) fun schedule(
            handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>,
            data: AnyStruct?,
            timestamp: UFix64,
            priority: FlowTransactionScheduler.Priority,
            executionEffort: UInt64,
            fees: @FlowToken.Vault
        ): UInt64 {
            destroy fees
            return 0
        }

        access(Owner) fun scheduleByHandler(
            handlerTypeIdentifier: String,
            handlerUUID: UInt64?,
            data: AnyStruct?,
            timestamp: UFix64,
            priority: FlowTransactionScheduler.Priority,
            executionEffort: UInt64,
            fees: @FlowToken.Vault
        ): UInt64 {
            destroy fees
            return 0
        }
        
        access(Owner) fun cancel(id: UInt64): @FlowToken.Vault {
            // Return empty vault in stub (real implementation returns ~50% refund)
            let emptyVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            return <- emptyVault as! @FlowToken.Vault
        }
    }

    access(all) fun createManager(): @{Manager} {
        return <-create ManagerImpl()
    }

    init() {
        self.managerStoragePath = /storage/flowTransactionSchedulerManager
        self.managerPublicPath = /public/flowTransactionSchedulerManager
    }
}
