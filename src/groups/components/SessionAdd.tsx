import React from "react";
import { ApiHelper, GroupInterface, GroupServiceTimeInterface, InputBox, ErrorMessages, SessionInterface, DateHelper, UniqueIdHelper } from ".";

interface Props { group: GroupInterface, updatedFunction: (session: SessionInterface) => void }

export const SessionAdd: React.FC<Props> = (props) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [sessionDate, setSessionDate] = React.useState<Date>(new Date());
  const [groupServiceTimes, setGroupServiceTimes] = React.useState<GroupServiceTimeInterface[]>([]);
  const [serviceTimeId, setServiceTimeId] = React.useState("");

  const handleCancel = () => { props.updatedFunction(null); }
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }
  const loadData = React.useCallback(() => {
    ApiHelper.get("/groupservicetimes?groupId=" + props.group.id, "AttendanceApi").then(data => {
      setGroupServiceTimes(data);
      if (data.length > 0) setServiceTimeId(data[0].serviceTimeId);
    });
  }, [props.group]);

  const handleSave = () => {
    if (validate()) {
      let s = { groupId: props.group.id, sessionDate: sessionDate } as SessionInterface
      if (!UniqueIdHelper.isMissing(serviceTimeId)) s.serviceTimeId = serviceTimeId;
      ApiHelper.post("/sessions", [s], "AttendanceApi").then(() => {
        props.updatedFunction(s);
        setSessionDate(new Date());
      });
    }
  }

  const validate = () => {
    let errors: string[] = [];
    if (sessionDate === null || sessionDate < new Date(2000, 1, 1)) errors.push("Invalid date");
    setErrors(errors);
    return errors.length === 0;
  }

  const getServiceTimes = () => {
    if (groupServiceTimes.length === 0) return <></>
    else {
      let options = [];
      for (let i = 0; i < groupServiceTimes.length; i++) {
        let gst = groupServiceTimes[i];
        options.push(<option key={i} value={gst.serviceTimeId}>{gst.serviceTime.name}</option>);
      }

      return (
        <div className="form-group">
          <label htmlFor="serviceTime">Service Time</label>
          <select id="serviceTime" className="form-control" value={serviceTimeId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setServiceTimeId(e.currentTarget.value) }} onKeyDown={handleKeyDown}>{options}</select>
        </div>);
    }
  }

  React.useEffect(() => { if (props.group.id !== undefined) loadData(); }, [props.group, loadData]);

  return (
    <InputBox data-cy="add-session-box" headerIcon="calendar_month" headerText="Add a Session" saveFunction={handleSave} cancelFunction={handleCancel}>
      <ErrorMessages errors={errors} />
      {getServiceTimes()}

      <div className="form-group">
        <label>Session Date</label>
        <input type="date" className="form-control" value={DateHelper.formatHtml5Date(sessionDate)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSessionDate(new Date(e.currentTarget.value))} onKeyDown={handleKeyDown} />
      </div>
    </InputBox>

  );
}

