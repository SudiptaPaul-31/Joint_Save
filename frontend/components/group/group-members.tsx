"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { usePoolData } from "@/lib/data-layer/PoolDataProvider"

interface Member {
  id: string
  member_address: string
  contribution_amount: number
  status: "pending" | "paid" | "late"
  joined_at: string
}

interface GroupMembersProps {
  groupId: string
  /** Contract address when known — used as the cache key for deployed pools */
  contractAddress?: string
}

export function GroupMembers({ groupId, contractAddress }: GroupMembersProps) {
  // Prefer contract address as the cache key (already warming from GroupDetails
  // and GroupActivity on the same page). Fall back to DB id for pending pools.
  const cacheKey =
    contractAddress && contractAddress !== "pending_deployment"
      ? contractAddress
      : groupId

  const { data, isLoading } = usePoolData(cacheKey)

  // Members come from the DB document that the provider already fetched
  const members: Member[] = data?.db?.pool_members ?? []

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`

  if (isLoading && members.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Members ({members.length})</h3>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.member_address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm font-mono">{formatAddress(member.member_address)}</p>
                  <p className="text-xs text-muted-foreground">{member.contribution_amount.toFixed(2)} XLM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.status === "paid" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {member.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                {member.status === "late" && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}