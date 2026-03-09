"use client";

import { useEffect, useState } from "react";
import { fcl } from "@/lib/flow";

export default function WalletButton() {
  const [user, setUser] = useState<{ addr?: string | null; loggedIn?: boolean }>({ loggedIn: false });

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  const login = async () => {
    try {
      await fcl.authenticate();
    } catch (error) {
      // User cancelled authentication - this is expected behavior
      console.log("Authentication cancelled by user");
    }
  };

  const logout = () => {
    fcl.unauthenticate();
  };

  if (user.loggedIn && user.addr) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', padding: '8px 16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'monospace', color: '#e4e4e7' }}>
            {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
          </span>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#52525b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={login} style={{
      background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
      border: 'none', borderRadius: '99px', padding: '10px 24px',
      fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(129,140,248,0.25)', fontFamily: 'Inter, sans-serif',
    }}>
      Connect Wallet
    </button>
  );
}
