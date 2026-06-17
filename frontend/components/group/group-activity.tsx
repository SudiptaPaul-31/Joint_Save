"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, UserPlus, Settings, Loader2, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePoolData } from "@/lib/data-layer/PoolDataProvider"

interface Activity {
  id: string
  activity_type: string
  user_address: string | null
  amount: number | null
  description: string | null
  created_at: string
  tx_hash: string | null
}

interface GroupActivityProps {
  groupId: string
  /** Contract address when known — used as the shared cache key */
  contractAddress?: string
}

export function GroupActivity({ groupId, contractAddress }: GroupActivityProps) {
  // All three sibling components (GroupDetails, GroupMembers, GroupActivity)
  // share the SAME cache key, so only 1 RPC call fires regardless of which
  // component mounts first. The setInterval polling is now centralised in
  // PoolDataProvider — no duplicate loops needed here.
  const cacheKey =
    contractAddress && contractAddress !== "pending_deployment"
      ? contractAddress
      : groupId

  const { data, isLoading, refetch } = usePoolData(cacheKey)

  const activities: Activity[] = (data?.db?.pool_activity ?? []).sort(
    (a: Activity, b: Activity) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const formatAddress = (address: string | null) => {
    if (!address) return "System"
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      if (diffMs < 0) return "Just now"

      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown date"
    }
  }

  const getBlockExplorerUrl = (txHash: string | null) => {
    if (!txHash) return null
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`
  }

  if (isLoading && activities.length === 0) {
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        {/* Refresh delegates to the provider's centralised refetch — no
            local interval or independent fetch logic required. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                  activity.activity_type === "deposit"
                    ? "bg-primary/10"
                    : activity.activity_type === "payout"
                    ? "bg-accent/10"
                    : "bg-muted"
                }`}
              >
                {activity.activity_type === "deposit" && <ArrowUpRight className="h-5 w-5 text-primary" />}
                {activity.activity_type === "payout" && <ArrowDownLeft className="h-5 w-5 text-accent" />}
                {activity.activity_type === "member_joined" && <UserPlus className="h-5 w-5 text-muted-foreground" />}
                {!["deposit", "payout", "member_joined"].includes(activity.activity_type) && (
                  <Settings className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm capitalize">
                    {activity.activity_type === "deposit" && "Deposit"}
                    {activity.activity_type === "payout" && "Payout"}
                    {activity.activity_type === "member_joined" && "Member Joined"}
                    {activity.activity_type === "pool_created" && "Pool Created"}
                    {!["deposit", "payout", "member_joined", "pool_created"].includes(activity.activity_type) &&
                      activity.activity_type}
                  </p>
                  {activity.amount && (
                    <Badge variant="secondary">{activity.amount.toFixed(2)} XLM</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAddress(activity.user_address)} • {formatTime(activity.created_at)}
                </p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                )}
                {activity.tx_hash ? (
                  getBlockExplorerUrl(activity.tx_hash) && (
                    <a
                      href={getBlockExplorerUrl(activity.tx_hash)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      View on Stellar Expert
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">No transaction hash</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}