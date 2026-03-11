import { Spinner } from "@/components/ui/spinner";

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted/30">
    <Spinner className="size-8" />
  </div>
);

export default Loading;
