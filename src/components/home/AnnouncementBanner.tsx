import type { Announcement } from "@/apis/announcements";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface AnnouncementBannerProps {
  announcement: Announcement;
  onDismiss?: () => void;
  onPress?: () => void;
}

const typeStyles = {
  info: { border: "border-l-primary", bg: "bg-primary/5", icon: Info, color: "text-primary" },
  success: { border: "border-l-green-500", bg: "bg-green-50", icon: CheckCircle, color: "text-green-600" },
  warning: { border: "border-l-amber-500", bg: "bg-amber-50", icon: AlertCircle, color: "text-amber-600" },
  error: { border: "border-l-red-500", bg: "bg-red-50", icon: AlertCircle, color: "text-red-600" },
};

export function AnnouncementBanner({ announcement, onDismiss, onPress }: AnnouncementBannerProps) {
  const style = typeStyles[announcement.type] ?? typeStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border border-l-4 ${style.border} ${style.bg} cursor-pointer`}
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPress?.()}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${style.color}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{announcement.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{announcement.message}</p>
        {announcement.link && announcement.link_text && (
          <p className={`text-sm font-medium mt-1 ${style.color}`}>
            {announcement.link_text} →
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
