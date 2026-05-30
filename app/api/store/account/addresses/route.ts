import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Retrieve all addresses for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: {
        isDefault: "desc", // Default address first
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("GET customer addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST: Add a new address for the logged-in user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { fullAddress, isDefault } = await request.json();

    if (!fullAddress || !fullAddress.trim()) {
      return NextResponse.json({ error: "Address content is required" }, { status: 400 });
    }

    const trimmedAddress = fullAddress.trim();
    const normalizedNewAddress = trimmedAddress.replace(/\s+/g, ' ').toLowerCase();

    // Fetch user's existing addresses
    const existingAddresses = await prisma.address.findMany({
      where: { userId },
    });

    const matchingAddress = existingAddresses.find(addr => 
      addr.fullAddress.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedNewAddress
    );

    const addressCount = existingAddresses.length;
    const setAsDefault = addressCount === 0 || isDefault === true;

    if (matchingAddress) {
      if (setAsDefault && !matchingAddress.isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
        const updated = await prisma.address.update({
          where: { id: matchingAddress.id },
          data: { isDefault: true },
        });
        return NextResponse.json({ success: true, address: updated });
      }
      return NextResponse.json({ success: true, address: matchingAddress });
    }

    // If setting as default, update all existing addresses to not be default
    if (setAsDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullAddress: trimmedAddress,
        isDefault: setAsDefault,
      },
    });

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error) {
    console.error("POST customer address error:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

// PATCH: Update address status (set default or update full address text)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { addressId, fullAddress, isDefault } = await request.json();

    if (!addressId) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (fullAddress !== undefined) {
      if (!fullAddress.trim()) {
        return NextResponse.json({ error: "Address content cannot be empty" }, { status: 400 });
      }
      updateData.fullAddress = fullAddress.trim();
    }

    if (isDefault === true) {
      // Set all other addresses for this user to isDefault: false
      await prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    } else if (isDefault === false && existingAddress.isDefault) {
      // Cannot unset default if it's the only address
      const otherAddress = await prisma.address.findFirst({
        where: { userId, id: { not: addressId } },
      });
      if (!otherAddress) {
        return NextResponse.json({ error: "You must have at least one default address" }, { status: 400 });
      }
      // If we unset this default, we must promote the other address to default
      await prisma.address.update({
        where: { id: otherAddress.id },
        data: { isDefault: true },
      });
      updateData.isDefault = false;
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    return NextResponse.json({ success: true, address: updatedAddress });
  } catch (error) {
    console.error("PATCH customer address error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// DELETE: Delete a saved address
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const url = new URL(request.url);
    const addressId = url.searchParams.get("addressId");

    if (!addressId) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId },
    });

    // If the deleted address was the default, promote another address to default
    if (existingAddress.isDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: { userId },
      });
      if (remainingAddress) {
        await prisma.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("DELETE customer address error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
