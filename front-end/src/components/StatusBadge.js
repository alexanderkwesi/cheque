import React from "react";
import { Badge, Tooltip } from "@mui/material";
import {
  CheckCircle,
  Pending,
  Error,
  Schedule,
  Cancel,
  PlayCircle,
  Block,
} from "@mui/icons-material";

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const statusConfig = {
      pending: {
        icon: <Pending />,
        color: "warning",
        label: "Pending Review",
        tooltip: "Cheque is awaiting review and processing",
      },
      processing: {
        icon: <PlayCircle />,
        color: "info",
        label: "Processing",
        tooltip: "Cheque is currently being processed",
      },
      approved: {
        icon: <CheckCircle />,
        color: "success",
        label: "Approved",
        tooltip: "Cheque has been approved and will be deposited",
      },
      rejected: {
        icon: <Cancel />,
        color: "error",
        label: "Rejected",
        tooltip: "Cheque was rejected during review",
      },
      cancelled: {
        icon: <Block />,
        color: "default",
        label: "Cancelled",
        tooltip: "Cheque processing was cancelled",
      },
      on_hold: {
        icon: <Schedule />,
        color: "secondary",
        label: "On Hold",
        tooltip: "Cheque processing is temporarily on hold",
      },
      completed: {
        icon: <CheckCircle />,
        color: "success",
        label: "Completed",
        tooltip: "Cheque has been successfully processed and deposited",
      },
      failed: {
        icon: <Error />,
        color: "error",
        label: "Failed",
        tooltip: "Cheque processing failed due to an error",
      },
    };

    return (
      statusConfig[status] || {
        icon: <Pending />,
        color: "default",
        label: "Unknown",
        tooltip: "Status information not available",
      }
    );
  };

  const { icon, color, label, tooltip } = getStatusConfig(status);

  return (
    <Tooltip title={tooltip} arrow>
      <Badge
        badgeContent={
          <span
            style={{
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {icon}
            {label}
          </span>
        }
        color={color}
        sx={{
          "& .MuiBadge-badge": {
            right: -10,
            top: 13,
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            textTransform: "capitalize",
          },
        }}
      />
    </Tooltip>
  );
};

export default StatusBadge;
