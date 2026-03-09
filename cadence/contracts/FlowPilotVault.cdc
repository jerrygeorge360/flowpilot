access(all) contract FlowPilotVault {

    // Events
    access(all) event VaultCreated(owner: Address)
    access(all) event Deposited(owner: Address, amount: UFix64)
    access(all) event Withdrawn(owner: Address, amount: UFix64)
    access(all) event YieldAccrued(owner: Address, amount: UFix64)

    // 5.00% APY in basis points
    access(all) let APYBps: UFix64

    // The Vault resource — can only exist in one place at a time
    access(all) resource Vault {
        access(all) var balance: UFix64
        access(all) var depositedAt: UFix64

        init() {
            self.balance = 0.0
            self.depositedAt = getCurrentBlock().timestamp
        }

        // Computes pending linear yield since last accrual timestamp.
        // `depositedAt` is treated as `lastAccruedAt` to keep storage layout stable.
        access(all) view fun pendingYield(): UFix64 {
            let now = getCurrentBlock().timestamp
            if now <= self.depositedAt || self.balance == 0.0 {
                return 0.0
            }

            let elapsed = now - self.depositedAt
            let yearSeconds = 31536000.0
            let apy = FlowPilotVault.APYBps / 10000.0
            return self.balance * apy * (elapsed / yearSeconds)
        }

        access(all) fun accrueYield(owner: Address) {
            let accrued = self.pendingYield()
            if accrued > 0.0 {
                self.balance = self.balance + accrued
                emit YieldAccrued(owner: owner, amount: accrued)
            }
            self.depositedAt = getCurrentBlock().timestamp
        }

        access(all) fun deposit(amount: UFix64, owner: Address) {
            self.accrueYield(owner: owner)
            self.balance = self.balance + amount
            emit Deposited(owner: owner, amount: amount)
        }

        access(all) fun withdraw(amount: UFix64, owner: Address): UFix64 {
            self.accrueYield(owner: owner)
            if self.balance < amount {
                panic("Insufficient balance")
            }
            self.balance = self.balance - amount
            emit Withdrawn(owner: owner, amount: amount)
            return amount
        }

        // Realistic accrued balance preview with APY-based yield.
        // Uses pending yield since last accrual and includes it in read output.
        access(all) fun getBalanceWithYield(): UFix64 {
            return self.balance + self.pendingYield()
        }
    }

    access(all) fun createVault(owner: Address): @Vault {
        emit VaultCreated(owner: owner)
        return <- create Vault()
    }

    access(all) let VaultStoragePath: StoragePath
    access(all) let VaultPublicPath: PublicPath

    init() {
        self.VaultStoragePath = /storage/flowPilotVault
        self.VaultPublicPath = /public/flowPilotVault
        self.APYBps = 500.0
    }
}
