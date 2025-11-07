import { timeAgo } from "@/lib/timeAgo";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import "./PostModal.css";
import { MapPin, Clock4 } from "lucide-react";

type Props = {
    data: {
        handle: string;
        category: string;
        severity: string;
        text: string;
        location: string;
        time: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const PostModal = ({ data, open, onOpenChange }: Props) => {
  const { handle, category, severity, text, location, time } = data;
  const prettyTime = time ? timeAgo(time) : "";

  return (
    <div className="PostModal">
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Disaster Post</DialogTitle>
                </DialogHeader>
                <div className="header">
                    <p className="handle-text">@{handle}</p>
                    <div className="badges">
                        <Badge className="rounded-full px-3 py-1 border-2 capitalize flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis">
                            {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                        <Badge className="rounded-full px-2 py-1 capitalize flex items-center justify-center text-white"
                            style={
                                severity === "high"
                                    ? { backgroundColor: "#B91C1C" }
                                    : severity === "medium"
                                    ? { backgroundColor: "#CA8A04" }
                                    : severity === "low"
                                    ? { backgroundColor: "#67A9CF" }
                                    : undefined
                                }
                        >
                            {severity}
                        </Badge>
                    </div>
                </div>

                <div className="content">
                    <p className="post-text">{text}</p>
                </div>
      
                <div className="footer">
                    <div className="icon-label">
                        <MapPin size={16} className="text-slate-500" />
                        <p className="label-text">{location}</p>
                    </div>
                    <div className="icon-label">
                        <Clock4 size={16} className="text-slate-500" />
                        <p className="label-text">{prettyTime}</p>
                    </div>
                </div>
          
                <DialogFooter>
                    <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default PostModal;