access(all) contract FungibleToken {
    access(all) entitlement Withdraw

    access(all) resource interface Vault {
        access(all) var balance: UFix64
        access(Withdraw) fun withdraw(amount: UFix64): @{Vault}
        access(all) fun deposit(from: @{Vault})
    }
}
