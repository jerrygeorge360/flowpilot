import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Maximum free sponsored transactions per user
const MAX_SPONSORED_TRANSACTIONS = 10;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Missing address parameter" },
        { status: 400 }
      );
    }

    // Normalize address
    const normalizedAddress = address.toLowerCase();

    // Find or create user and sponsorship
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { sponsorship: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          sponsorship: {
            create: {
              freeTxTotal: MAX_SPONSORED_TRANSACTIONS,
              freeTxUsed: 0,
            },
          },
        },
        include: { sponsorship: true },
      });
    }

    const sponsorship = user.sponsorship;
    if (!sponsorship) {
      // Create sponsorship if missing
      const newSponsorship = await prisma.sponsorship.create({
        data: {
          userId: user.id,
          freeTxTotal: MAX_SPONSORED_TRANSACTIONS,
          freeTxUsed: 0,
        },
      });

      return NextResponse.json({
        address: normalizedAddress,
        sponsored: true,
        remaining: newSponsorship.freeTxTotal,
        used: 0,
        total: MAX_SPONSORED_TRANSACTIONS,
      });
    }

    const remaining = Math.max(0, sponsorship.freeTxTotal - sponsorship.freeTxUsed);
    const eligible = remaining > 0;

    return NextResponse.json({
      address: normalizedAddress,
      sponsored: eligible,
      remaining,
      used: sponsorship.freeTxUsed,
      total: sponsorship.freeTxTotal,
    });
  } catch (error: any) {
    console.error("Sponsor check error:", error);
    return NextResponse.json(
      { error: "Failed to check sponsorship status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: "Missing userAddress", sponsored: false },
        { status: 400 }
      );
    }

    // Normalize address
    const normalizedAddress = userAddress.toLowerCase();

    // Find or create user and sponsorship
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { sponsorship: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          sponsorship: {
            create: {
              freeTxTotal: MAX_SPONSORED_TRANSACTIONS,
              freeTxUsed: 0,
            },
          },
        },
        include: { sponsorship: true },
      });
    }

    let sponsorship = user.sponsorship;
    if (!sponsorship) {
      sponsorship = await prisma.sponsorship.create({
        data: {
          userId: user.id,
          freeTxTotal: MAX_SPONSORED_TRANSACTIONS,
          freeTxUsed: 0,
        },
      });
    }

    // Check if user has remaining sponsored transactions
    if (sponsorship.freeTxUsed >= sponsorship.freeTxTotal) {
      return NextResponse.json({
        sponsored: false,
        reason: "Maximum free transactions reached",
        remaining: 0,
      });
    }

    // Increment the counter
    const updated = await prisma.sponsorship.update({
      where: { id: sponsorship.id },
      data: {
        freeTxUsed: sponsorship.freeTxUsed + 1,
        lastSponsoredAt: new Date(),
      },
    });

    // Validate sponsor envs are configured
    const sponsorAddress = process.env.FLOW_SPONSOR_ADDRESS;
    const sponsorPrivateKey = process.env.FLOW_SPONSOR_PRIVATE_KEY;
    if (!sponsorAddress || !sponsorPrivateKey) {
      return NextResponse.json({
        sponsored: false,
        reason: "Sponsor not configured",
      });
    }

    // Return the sponsor authorization for the frontend to use
    return NextResponse.json({
      sponsored: true,
      remaining: updated.freeTxTotal - updated.freeTxUsed,
      used: updated.freeTxUsed,
      total: updated.freeTxTotal,
      // Return a serializable representation of the sponsor account
      sponsorAddress,
    });
  } catch (error: any) {
    console.error("Sponsor transaction error:", error);
    return NextResponse.json(
      { error: "Failed to process sponsorship", sponsored: false },
      { status: 500 }
    );
  }
}
