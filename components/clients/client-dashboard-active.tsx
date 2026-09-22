"use client";

import { motion } from "framer-motion";

import type { ClientDashboardData } from "@/lib/clients/types";

import { TrackingBoard } from "./tracking/tracking-board";

type ClientDashboardActiveProps = {
  data: ClientDashboardData;
  onRefresh?: () => void;
};

export function ClientDashboardActive({ data, onRefresh }: ClientDashboardActiveProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <TrackingBoard data={data} onRefresh={onRefresh} />
    </motion.div>
  );
}
