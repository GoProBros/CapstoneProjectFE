import type { SubscriptionDto } from "@/types/subscription";

export interface SubscriptionWithStatus extends SubscriptionDto {
  isActive: boolean;
}

export interface SubscriptionDraft {
  id: number;
  name: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: string[];
  isActive: boolean;
}

export interface CreateSubscriptionDraft {
  name: string;
  levelOrder: number;
  maxWorkspaces: number;
  price: number;
  durationInDays: number;
  allowedModules: string[];
  isActive: boolean;
}
