/* The Motion film's React (Nucleux video/bundles/how-film-vendor.js, the film's
   nx-react.js module): a film module holds at
   most 200 KiB, so React lives in its own module and how-film.js reads it
   from these globals. */
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as ReactJSXRuntime from "react/jsx-runtime";
/* shared by every Nucleux component (cn, tailwind-merge): here so the scenes module stays under the cap */
import * as NucleuxUtils from "@nucleux/utils";

Object.assign(window, { React, ReactDOM, ReactDOMClient, ReactJSXRuntime, NucleuxUtils });
