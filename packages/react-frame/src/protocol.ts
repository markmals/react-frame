import type { ReactFormState } from "react-dom/client";

/** Requests that accept this content type receive an RSC payload instead of an HTML document. */
export const RSC_CONTENT_TYPE = "text/x-component";

/** Header carrying the server function id when the browser calls a server function. */
export const ACTION_ID_HEADER = "x-rsc-action";

export type Payload =
  | {
      type: "render";
      root: React.ReactNode;
      formState?: ReactFormState;
    }
  | {
      type: "redirect";
      location: string;
      returnValue?: Promise<unknown>;
    }
  | {
      /** A server function's result, sent without re-rendering the page. */
      type: "action";
      returnValue: Promise<unknown>;
    };

export function isRscRequest(request: Request) {
  return request.headers.get("Accept")?.includes(RSC_CONTENT_TYPE) ?? false;
}

export function isRscResponse(response: Response) {
  return response.headers.get("Content-Type")?.startsWith(RSC_CONTENT_TYPE) ?? false;
}
