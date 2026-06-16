import { ReactNode } from "react";
import { 
  InformationCircleIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

export function Alert({ 
  variant = "info", 
  title, 
  children, 
  className, 
  showIcon = true 
}: AlertProps) {
  const Icon = showIcon ? iconMap[variant] : null;

  return (
    <div role="alert" className={cn(`alert alert-${variant} shadow-sm`, className)}>
      {Icon && <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />}
      <div className="flex-1 w-full">
        {title && <h3 className="font-bold">{title}</h3>}
        <div className="text-sm w-full">{children}</div>
      </div>
    </div>
  );
}
