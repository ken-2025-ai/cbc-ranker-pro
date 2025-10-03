import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show toast only once per session
      if (!hasShownPrompt) {
        setTimeout(() => {
          toast("Install CBC BAMS App", {
            description: "Install this app on your device for quick access and offline support",
            action: {
              label: "Install",
              onClick: () => handleInstallClick(promptEvent),
            },
            duration: 10000,
            icon: <Download className="h-5 w-5" />,
          });
          setHasShownPrompt(true);
        }, 2000); // Show after 2 seconds
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      toast.success("App installed successfully!", {
        description: "You can now access CBC BAMS from your home screen",
      });
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [hasShownPrompt]);

  const handleInstallClick = async (promptEvent: BeforeInstallPromptEvent) => {
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  return null;
};
