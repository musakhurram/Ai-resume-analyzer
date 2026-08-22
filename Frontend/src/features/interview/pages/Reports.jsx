import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listReports } from "../services/interview.api";
import ReportCard from "../components/ReportCard";
import PageLoader from "../../../shared/components/PageLoader";
import EmptyState from "../../../shared/components/EmptyState";
import Callout from "../../../shared/components/Callout";
import Button from "../../../shared/components/Button";
import "./Reports.scss";

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listReports()
      .then((data) => {
        if (!cancelled) setReports(data.reports || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Couldn't load reports.");
          setReports([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (reports === null) {
    return <PageLoader label="Pulling your reports" />;
  }

  return (
    <div className="reports-page">
      <header className="page-header">
        <p className="eyebrow">Filed reviews</p>
        <h1>Past reports</h1>
        <p className="page-header__desc">
          Every resume-to-job comparison you've run, most recent first.
        </p>
      </header>

      {error && <Callout tone="error" title="Couldn't load reports">{error}</Callout>}

      {reports.length === 0 ? (
        <EmptyState
          eyebrow="Nothing filed yet"
          title="Your first report will land here"
          description="Run a review against a job description and it'll show up in this list, ready to revisit."
          action={
            <Button as={Link} to="/" variant="primary">
              Start a review
            </Button>
          }
        />
      ) : (
        <div className="reports-page__list">
          {reports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
