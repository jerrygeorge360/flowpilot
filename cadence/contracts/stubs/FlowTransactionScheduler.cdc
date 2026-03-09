access(all) contract FlowTransactionScheduler {
    access(all) entitlement Execute

    access(all) enum Priority: UInt8 {
        access(all) case High
        access(all) case Medium
        access(all) case Low
    }

    access(all) resource interface TransactionHandler {
        access(Execute) fun executeTransaction(id: UInt64, data: AnyStruct?)
        access(all) view fun getViews(): [Type]
        access(all) fun resolveView(_ view: Type): AnyStruct?
    }

    access(all) fun calculateFee(executionEffort: UInt64, priority: Priority, dataSizeMB: UFix64): UFix64 {
        return 0.2
    }

    access(all) fun getSizeOfData(_ data: AnyStruct): UFix64 {
        return 0.0
    }
}
