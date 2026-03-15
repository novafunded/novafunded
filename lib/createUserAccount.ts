import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ADMIN_EMAIL } from "@/lib/admin"

type ChallengePreset = {
  planName: string
  startBalance: number
  dailyLossLimit: number
  maxLossLimit: number
}

type CreateUserAccountParams = {
  uid: string
  email: string
  displayName?: string | null
  activateChallenge?: boolean
  challengePreset?: Partial<ChallengePreset>
}

const DEFAULT_CHALLENGE: ChallengePreset = {
  planName: "Flash 5K",
  startBalance: 5000,
  dailyLossLimit: 250,
  maxLossLimit: 500,
}

function buildChallengePreset(
  preset?: Partial<ChallengePreset>,
): ChallengePreset {
  return {
    planName:
      typeof preset?.planName === "string" && preset.planName.trim() !== ""
        ? preset.planName.trim()
        : DEFAULT_CHALLENGE.planName,
    startBalance:
      typeof preset?.startBalance === "number" && preset.startBalance > 0
        ? preset.startBalance
        : DEFAULT_CHALLENGE.startBalance,
    dailyLossLimit:
      typeof preset?.dailyLossLimit === "number" && preset.dailyLossLimit > 0
        ? preset.dailyLossLimit
        : DEFAULT_CHALLENGE.dailyLossLimit,
    maxLossLimit:
      typeof preset?.maxLossLimit === "number" && preset.maxLossLimit > 0
        ? preset.maxLossLimit
        : DEFAULT_CHALLENGE.maxLossLimit,
  }
}

export async function createUserAccount(
  params: CreateUserAccountParams,
): Promise<string> {
  const {
    uid,
    email,
    displayName,
    activateChallenge = false,
    challengePreset,
  } = params

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedAdminEmail = ADMIN_EMAIL.trim().toLowerCase()
  const role = normalizedEmail === normalizedAdminEmail ? "admin" : "user"

  const userRef = doc(db, "users", uid)
  const userSnap = await getDoc(userRef)

  const existingUserData = userSnap.exists()
    ? (userSnap.data() as {
        activeAccountId?: string
        displayName?: string
        role?: string
        email?: string
      })
    : null

  const existingActiveAccountId =
    typeof existingUserData?.activeAccountId === "string"
      ? existingUserData.activeAccountId.trim()
      : ""

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      email: normalizedEmail,
      displayName: displayName ?? "",
      role,
      activeAccountId: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    const userUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    }

    if (
      typeof existingUserData?.email !== "string" ||
      existingUserData.email.trim().toLowerCase() !== normalizedEmail
    ) {
      userUpdates.email = normalizedEmail
    }

    if (
      typeof existingUserData?.displayName !== "string" &&
      typeof displayName === "string"
    ) {
      userUpdates.displayName = displayName
    } else if (
      typeof displayName === "string" &&
      displayName.trim() !== "" &&
      existingUserData?.displayName !== displayName
    ) {
      userUpdates.displayName = displayName
    }

    if (
      typeof existingUserData?.role !== "string" ||
      existingUserData.role !== role
    ) {
      userUpdates.role = role
    }

    await updateDoc(userRef, userUpdates)
  }

  const shouldAutoActivate = activateChallenge || role === "admin"

  if (!shouldAutoActivate) {
    return existingActiveAccountId
  }

  if (existingActiveAccountId) {
    const existingAccountRef = doc(db, "accounts", existingActiveAccountId)
    const existingAccountSnap = await getDoc(existingAccountRef)

    if (existingAccountSnap.exists()) {
      const existingAccountData = existingAccountSnap.data() as {
        userId?: string
        planName?: string
        startBalance?: number
        balance?: number
        equity?: number
        dailyLossLimit?: number
        maxLossLimit?: number
        breached?: boolean
        phase?: string | number
        status?: string
        tradingDays?: number
        closedTrades?: number
      }

      const preset = buildChallengePreset(challengePreset)

      const accountUpdates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (
        typeof existingAccountData.userId !== "string" ||
        existingAccountData.userId !== uid
      ) {
        accountUpdates.userId = uid
      }

      if (
        typeof existingAccountData.planName !== "string" ||
        existingAccountData.planName.trim() === ""
      ) {
        accountUpdates.planName = preset.planName
      }

      if (typeof existingAccountData.startBalance !== "number") {
        accountUpdates.startBalance = preset.startBalance
      }

      if (typeof existingAccountData.balance !== "number") {
        accountUpdates.balance = preset.startBalance
      }

      if (typeof existingAccountData.equity !== "number") {
        accountUpdates.equity = preset.startBalance
      }

      if (typeof existingAccountData.dailyLossLimit !== "number") {
        accountUpdates.dailyLossLimit = preset.dailyLossLimit
      }

      if (typeof existingAccountData.maxLossLimit !== "number") {
        accountUpdates.maxLossLimit = preset.maxLossLimit
      }

      if (typeof existingAccountData.breached !== "boolean") {
        accountUpdates.breached = false
      }

      if (typeof existingAccountData.phase === "number") {
        accountUpdates.phase = `Phase ${existingAccountData.phase}`
      } else if (
        typeof existingAccountData.phase !== "string" ||
        existingAccountData.phase.trim() === ""
      ) {
        accountUpdates.phase = "Phase 1"
      }

      if (
        typeof existingAccountData.status !== "string" ||
        existingAccountData.status.trim() === ""
      ) {
        accountUpdates.status = "active"
      }

      if (typeof existingAccountData.tradingDays !== "number") {
        accountUpdates.tradingDays = 0
      }

      if (typeof existingAccountData.closedTrades !== "number") {
        accountUpdates.closedTrades = 0
      }

      await updateDoc(existingAccountRef, accountUpdates)
      return existingActiveAccountId
    }
  }

  const preset = buildChallengePreset(challengePreset)
  const newAccountRef = doc(collection(db, "accounts"))
  const newAccountId = newAccountRef.id

  await setDoc(newAccountRef, {
    userId: uid,
    planName: preset.planName,
    startBalance: preset.startBalance,
    balance: preset.startBalance,
    equity: preset.startBalance,
    dailyLossLimit: preset.dailyLossLimit,
    maxLossLimit: preset.maxLossLimit,
    breached: false,
    phase: "Phase 1",
    status: "active",
    tradingDays: 0,
    closedTrades: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateDoc(userRef, {
    activeAccountId: newAccountId,
    updatedAt: serverTimestamp(),
  })

  return newAccountId
}
