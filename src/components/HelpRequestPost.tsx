//import { useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import {   Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle, } from "./ui/card";
//import supabase from "../supabase-client";

type Props = {
  data: {
    handle: string;
    category: string;
    severity: string;
    text: string;
    location: string;
    //time: string;
  };
};

const HelpRequestPost = ({ data }: Props) => {
  const { handle, category, severity, text, location} = data;

  return (
      <Card className="w-full max-w-xl HelpRequestPost">
          <CardHeader>
          <CardDescription><strong>@{handle}</strong></CardDescription>
          <CardAction>
              <Badge variant="outline">{category}</Badge>
              <Badge variant="destructive">{severity}</Badge>
          </CardAction>
        </CardHeader>

        <CardContent>
          <p>{text}</p>
        </CardContent>
        

        <p>{location}</p>
        {/*<p>{time}</p>*/}
      </Card>
  );
};

export default HelpRequestPost;