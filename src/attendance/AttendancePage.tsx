import React from "react";
import { ApiHelper, DisplayBox, AttendanceInterface, CampusInterface, CampusEdit, ServiceEdit, ServiceInterface, ServiceTimeEdit, ServiceTimeInterface, Tabs, GroupServiceTimeInterface, GroupInterface, ArrayHelper, Loading } from "./components";
import { Link } from "react-router-dom";
import { Grid, Icon, Table, TableBody, TableCell, TableRow, TableHead } from "@mui/material"

export const AttendancePage = () => {
  const [attendance, setAttendance] = React.useState<AttendanceInterface[]>([]);
  const [groupServiceTimes, setGroupServiceTimes] = React.useState<GroupServiceTimeInterface[]>([]);
  const [groups, setGroups] = React.useState<GroupInterface[]>([]);

  const [selectedCampus, setSelectedCampus] = React.useState<CampusInterface>(null);
  const [selectedService, setSelectedService] = React.useState<ServiceInterface>(null);
  const [selectedServiceTime, setSelectedServiceTime] = React.useState<ServiceTimeInterface>(null);
  //const [filter, setFilter] = React.useState<AttendanceFilterInterface>(AttendanceHelper.createFilter());

  const handleUpdated = () => { removeEditors(); loadData(); }
  const selectCampus = (campus: CampusInterface) => { removeEditors(); if (campus.name !== "Undefined") setSelectedCampus(campus); }
  const selectService = (service: ServiceInterface) => { removeEditors(); setSelectedService(service); }
  const selectServiceTime = (service: ServiceTimeInterface) => { removeEditors(); setSelectedServiceTime(service); }
  const removeEditors = () => { setSelectedCampus(null); setSelectedService(null); setSelectedServiceTime(null); }

  const loadData = () => {
    ApiHelper.get("/attendancerecords/tree", "AttendanceApi").then(data => setAttendance(data))
    ApiHelper.get("/groupservicetimes", "AttendanceApi").then(data => setGroupServiceTimes(data))
    ApiHelper.get("/groups", "MembershipApi").then(data => setGroups(data))
  }

  let lastCampus = "";
  let lastService = "";
  let lastServiceTime = "";
  let lastCategory = "";

  React.useEffect(() => { loadData(); }, []);

  const compare = (a: GroupInterface, b: GroupInterface) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name)

  const getRows = () => {
    const rows: JSX.Element[] = [];

    if (attendance.length === 0) {
      rows.push(<TableRow key="0"><TableCell>Group attendance will show up once sessions have been added to a group and people have attended those sessions.</TableCell></TableRow>);
      return rows;
    }

    attendance.forEach((a, i) => {
      const filteredGroups = (a.serviceTime === undefined) ? [] : getGroups(a.serviceTime.id);
      const sortedGroups = filteredGroups.sort(compare);
      if (sortedGroups.length > 0) sortedGroups.forEach(g => { rows.push(getRow(a.campus, a.service, a.serviceTime, g, g.id.toString())); });
      else rows.push(getRow(a.campus, a.service, a.serviceTime, undefined, "index" + i.toString()));
    })
    getUnassignedGroups().forEach(g => { rows.push(getRow({ name: "Unassigned" }, undefined, undefined, g, g.id.toString())); });
    return rows;
  }

  const getRow = (campus: CampusInterface, service: ServiceInterface, serviceTime: ServiceTimeInterface, group: GroupInterface, key: string) => {
    let campusHtml = (campus === undefined || campus?.name === lastCampus) ? <></> : <><Icon>church</Icon><a href="about:blank" onClick={(e) => { e.preventDefault(); selectCampus(campus); }}>{campus.name}</a></>
    let serviceHtml = (service === undefined || service?.name === lastService) ? <></> : <><Icon>calendar_month</Icon><a href="about:blank" onClick={(e) => { e.preventDefault(); selectService(service); }}>{service.name}</a></>
    let serviceTimeHtml = (serviceTime === undefined || serviceTime?.name === lastServiceTime) ? <></> : <><Icon>schedule</Icon><a href="about:blank" onClick={(e) => { e.preventDefault(); selectServiceTime(serviceTime); }}>{serviceTime.name}</a></>
    let categoryHtml = (group === undefined || group?.categoryName === lastCategory) ? <></> : <><Icon>folder</Icon>{group.categoryName}</>
    let groupHtml = (group === undefined) ? <></> : <><Icon>list</Icon><Link to={"/groups/" + group.id}>{group.name}</Link></>

    const result = (<TableRow key={key}><TableCell>{campusHtml}</TableCell><TableCell>{serviceHtml}</TableCell><TableCell>{serviceTimeHtml}</TableCell><TableCell>{categoryHtml}</TableCell><TableCell>{groupHtml}</TableCell></TableRow>)

    lastCampus = campus?.name;
    lastService = service?.name;
    lastServiceTime = serviceTime?.name;
    lastCategory = group?.categoryName;
    return result;
  }

  const getUnassignedGroups = () => {
    const result: GroupInterface[] = [];
    groups.forEach(g => {
      if (g.trackAttendance) {
        const gsts: GroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "groupId", g.id);
        if (gsts.length === 0) result.push(g);
      }
    });
    return result;
  }

  const getGroups = (serviceTimeId: string) => {
    const result: GroupInterface[] = [];
    const gsts: GroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "serviceTimeId", serviceTimeId);
    gsts.forEach(gst => {
      const group: GroupInterface = ArrayHelper.getOne(groups, "id", gst.groupId);
      if (group !== null && group.trackAttendance) result.push(group);
    });
    return result;
  }

  const getEditLinks = () => (
    <>
      <a id="addBtnGroup" aria-label="addButton" data-cy="add-button" type="button" data-toggle="dropdown" aria-expanded="false" href="about:blank"><Icon>add</Icon></a>
      <div className="dropdown-menu" aria-labelledby="addBtnGroup">
        <a className="dropdown-item" data-cy="add-campus" href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectCampus({ id: "", name: "New Campus" }); }}><Icon>church</Icon> Add Campus</a>
        <a className="dropdown-item" aria-label="addService" data-cy="add-service" href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectService({ id: "", campusId: "", name: "New Service" }); }}><Icon>calendar_month</Icon> Add Service</a>
        <a className="dropdown-item" data-cy="add-service-time" href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); selectServiceTime({ id: "", serviceId: "", name: "New Service Time" }); }}><Icon>more_time</Icon> Add Service Time</a>
      </div>
    </>
  )

  const getTableHeader = () => {
    const rows: JSX.Element[] = [];
    if (attendance.length === 0) return rows;
    rows.push(<TableRow key="header"><th>Campus</th><th>Service</th><th>Time</th><th>Category</th><th>Group</th></TableRow>);
    return rows;
  }

  const getTable = () => {
    if (!attendance) return <Loading />
    else return (<Table size="small">
      <TableHead>{getTableHeader()}</TableHead>
      <TableBody>{getRows()}</TableBody>
    </Table>);
  }

  return (
    <>
      <h1><Icon>calendar_month</Icon> Attendance</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox id="groupsBox" data-cy="attendance-groups" headerIcon="group" headerText="Groups" editContent={getEditLinks()}>
            {getTable()}
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          <CampusEdit campus={selectedCampus} updatedFunction={handleUpdated} />
          <ServiceEdit service={selectedService} updatedFunction={handleUpdated} />
          <ServiceTimeEdit serviceTime={selectedServiceTime} updatedFunction={handleUpdated} />
        </Grid>
      </Grid>
      <Tabs />
    </>
  );
}

