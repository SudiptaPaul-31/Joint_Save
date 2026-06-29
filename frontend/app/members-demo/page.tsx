"use client";
// TEMP DEMO PAGE — for screenshots only; DELETE this file before committing.
import { GroupMembers } from "@/components/group/group-members";

export default function MembersDemoPage() {
  return (
    <div className="mx-auto max-w-md p-8">
      <GroupMembers groupId="demo" />
    </div>
  );
}
