"use client";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AZ_COPY } from "@/lib/i18n";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ListingAuthoringErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      JSON.stringify({
        event: "bookswap.listing_authoring_client_error",
        name: error.name,
        hasComponentStack: Boolean(errorInfo.componentStack),
      }),
    );
  }

  private reset = () => {
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container-shell grid min-h-[650px] place-items-center py-16">
        <div className="card min-w-0 max-w-lg p-5 text-center sm:p-9">
          <span className="bookmark-badge">
            {AZ_COPY.listingForm.recoveryBadge}
          </span>
          <h1 className="display mt-5 break-words text-3xl font-semibold sm:text-4xl">
            {AZ_COPY.listingForm.recoveryTitle}
          </h1>
          <p className="mt-3 break-words text-sm leading-7 text-muted">
            {AZ_COPY.listingForm.recoveryBody}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={this.reset} className="btn-primary">
              {AZ_COPY.listingForm.recoveryAction}
            </button>
            <Link href="/profile" className="btn-secondary">
              {AZ_COPY.listingForm.myShelf}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
