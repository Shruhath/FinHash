import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { EASE_OUT } from "../../lib/motion";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: Props) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      <motion.div
        className="empty-state__icon"
        initial={{ scale: 0.7, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
      >
        <Icon size={28} strokeWidth={1.75} />
      </motion.div>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__text">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </motion.div>
  );
}
