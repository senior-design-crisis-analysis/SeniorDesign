//import { useEffect, useRef } from "react";
import { timeAgo } from "../lib/timeAgo";
import { Badge } from "./ui/badge";
import './HelpRequestPost.css'
import { MapPin, Clock4 } from 'lucide-react';
//import supabase from "../supabase-client";

type Props = {
  data: {
    handle: string;
    category: string;
    severity: string;
    text: string;
    location: string;
    time: string;
  };
};

const HelpRequestPost = ({ data }: Props) => {
  const { handle, category, severity, text, location, time } = data;
  const prettyTime = time ? timeAgo(time) : '';

  return (
      <div className="HelpRequestPost">
          <div className="header">
            <p className="handle-text">@{handle}</p>
            <div className="badges">
              <Badge variant="outline" className="capitalize">{category}</Badge>
              <Badge variant="destructive" className="capitalize">{severity}</Badge>
            </div>
          </div>

          <div className="content" >
            <p className="post-text">{text}</p>
          </div>

          <div className="footer">
            <div className="icon-label">
              <MapPin size={16} className="text-slate-500" />
              <p className="label-text">{location}</p>
            </div>
            <div className="icon-label">
              <Clock4 size={16} className="text-slate-500" />
              {/*<p className="label-text">{time}</p>*/}
              <p className="label-text">{prettyTime}</p>
            </div>
          </div>
      </div>
  );
};

export default HelpRequestPost;