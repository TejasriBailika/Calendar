import React, { Component } from "react";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import TextField from "material-ui/TextField";
import TimePicker from "material-ui/TimePicker";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Snackbar from "material-ui/Snackbar";
import "react-big-calendar/lib/css/react-big-calendar.css";

BigCalendar.momentLocalizer(moment);

class Calendar extends Component {
  constructor() {
    super();
    this.state = {
      events: [],
      title: "",
      start: null,
      end: null,
      desc: "",
      eventType: "meeting",
      openSlot: false,
      openEvent: false,
      clickedEvent: {},
      showNotification: false,
      notificationMessage: ""
    };
    
    // Bind all methods in constructor for better performance
    this.handleClose = this.handleClose.bind(this);
    this.handleSlotSelected = this.handleSlotSelected.bind(this);
    this.handleEventSelected = this.handleEventSelected.bind(this);
    this.setTitle = this.setTitle.bind(this);
    this.setDescription = this.setDescription.bind(this);
    this.handleStartTime = this.handleStartTime.bind(this);
    this.handleEndTime = this.handleEndTime.bind(this);
    this.setNewAppointment = this.setNewAppointment.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.handleEventTypeChange = this.handleEventTypeChange.bind(this);
    this.showNotification = this.showNotification.bind(this);
  }

  componentDidMount() {
    this.getCachedEvents();
  }

  getCachedEvents() {
    const cachedEvents = localStorage.getItem("cachedEvents");
    if (cachedEvents) {
      try {
        const parsedEvents = JSON.parse(cachedEvents).map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        this.setState({ events: parsedEvents });
      } catch (e) {
        console.error("Error parsing cached events", e);
      }
    }
  }

  saveEventsToCache(events) {
    localStorage.setItem("cachedEvents", JSON.stringify(events));
  }

  handleClose() {
    this.setState({ openEvent: false, openSlot: false });
  }

  handleSlotSelected(slotInfo) {
    // Set default end time to 1 hour after start
    const endTime = new Date(slotInfo.start);
    endTime.setHours(endTime.getHours() + 1);
    
    this.setState({
      title: "",
      desc: "",
      start: slotInfo.start,
      end: endTime,
      eventType: "meeting",
      openSlot: true
    });
  }

  handleEventSelected(event) {
    this.setState({
      openEvent: true,
      clickedEvent: event,
      start: event.start,
      end: event.end,
      title: event.title,
      desc: event.desc,
      eventType: event.eventType || "meeting"
    });
  }

  setTitle(e) {
    this.setState({ title: e.target.value });
  }

  setDescription(e) {
    this.setState({ desc: e.target.value });
  }

  handleEventTypeChange(event, index, value) {
    this.setState({ eventType: value });
  }

  handleStartTime(event, date) {
    this.setState({ start: date });
  }

  handleEndTime(event, date) {
    this.setState({ end: date });
  }

  showNotification(message) {
    this.setState({ 
      showNotification: true,
      notificationMessage: message 
    });
    setTimeout(() => this.setState({ showNotification: false }), 3000);
  }

  validateEvent() {
    const { title, start, end } = this.state;
    if (!title.trim()) {
      this.showNotification("Title is required");
      return false;
    }
    if (start >= end) {
      this.showNotification("End time must be after start time");
      return false;
    }
    return true;
  }

  setNewAppointment() {
    if (!this.validateEvent()) return;
    
    const { start, end, title, desc, eventType } = this.state;
    const appointment = { 
      title, 
      start, 
      end, 
      desc, 
      eventType,
      id: Date.now() // Add unique ID
    };
    
    const events = [...this.state.events, appointment];
    this.saveEventsToCache(events);
    this.setState({ events });
    this.showNotification("Event created successfully!");
    this.handleClose();
  }

  updateEvent() {
    if (!this.validateEvent()) return;
    
    const { title, desc, start, end, events, clickedEvent, eventType } = this.state;
    const updatedEvents = events.map(event => 
      event.id === clickedEvent.id 
        ? { ...event, title, desc, start, end, eventType }
        : event
    );
    
    this.saveEventsToCache(updatedEvents);
    this.setState({ events: updatedEvents });
    this.showNotification("Event updated successfully!");
    this.handleClose();
  }

  deleteEvent() {
    const { events, clickedEvent } = this.state;
    const updatedEvents = events.filter(event => event.id !== clickedEvent.id);
    
    this.saveEventsToCache(updatedEvents);
    this.setState({ events: updatedEvents });
    this.showNotification("Event deleted successfully!");
    this.handleClose();
  }

  getEventStyle(event) {
    const colors = {
      meeting: "#2196F3",
      personal: "#4CAF50",
      urgent: "#F44336",
      other: "#9C27B0"
    };
    
    return {
      style: {
        backgroundColor: colors[event.eventType] || colors.other,
        borderRadius: "4px",
        color: "white",
        border: "none"
      }
    };
  }

  render() {
    const eventActions = [
      <FlatButton label="Cancel" onClick={this.handleClose} />,
      <FlatButton 
        label="Delete" 
        secondary={true} 
        onClick={this.deleteEvent}
      />,
      <FlatButton 
        label="Save" 
        primary={true} 
        onClick={this.updateEvent}
      />
    ];
    
    const appointmentActions = [
      <FlatButton label="Cancel" onClick={this.handleClose} />,
      <FlatButton 
        label="Create" 
        primary={true} 
        onClick={this.setNewAppointment}
      />
    ];

    return (
      <div id="Calendar">
        <BigCalendar
          events={this.state.events}
          views={["month", "week", "day", "agenda"]}
          timeslots={2}
          defaultView="month"
          defaultDate={new Date()}
          selectable={true}
          onSelectEvent={this.handleEventSelected}
          onSelectSlot={this.handleSlotSelected}
          eventPropGetter={this.getEventStyle}
          style={{ height: "80vh", marginTop: "20px" }}
        />

        {/* New Appointment Dialog */}
        <Dialog
          title={`New Event on ${moment(this.state.start).format("MMMM Do YYYY")}`}
          actions={appointmentActions}
          modal={false}
          open={this.state.openSlot}
          onRequestClose={this.handleClose}
          autoScrollBodyContent={true}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <TextField
              floatingLabelText="Title *"
              value={this.state.title}
              onChange={this.setTitle}
              fullWidth={true}
            />
            
            <SelectField
              floatingLabelText="Event Type"
              value={this.state.eventType}
              onChange={this.handleEventTypeChange}
              fullWidth={true}
            >
              <MenuItem value="meeting" primaryText="Meeting" />
              <MenuItem value="personal" primaryText="Personal" />
              <MenuItem value="urgent" primaryText="Urgent" />
              <MenuItem value="other" primaryText="Other" />
            </SelectField>
            
            <TextField
              floatingLabelText="Description"
              value={this.state.desc}
              onChange={this.setDescription}
              multiLine={true}
              rows={2}
              fullWidth={true}
            />
            
            <div style={{ display: "flex", gap: "20px" }}>
              <TimePicker
                format="ampm"
                floatingLabelText="Start Time"
                minutesStep={15}
                value={this.state.start}
                onChange={this.handleStartTime}
                autoOk={true}
              />
              <TimePicker
                format="ampm"
                floatingLabelText="End Time"
                minutesStep={15}
                value={this.state.end}
                onChange={this.handleEndTime}
                autoOk={true}
              />
            </div>
          </div>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog
          title={`Edit Event on ${moment(this.state.start).format("MMMM Do YYYY")}`}
          actions={eventActions}
          modal={false}
          open={this.state.openEvent}
          onRequestClose={this.handleClose}
          autoScrollBodyContent={true}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <TextField
              floatingLabelText="Title *"
              value={this.state.title}
              onChange={this.setTitle}
              fullWidth={true}
            />
            
            <SelectField
              floatingLabelText="Event Type"
              value={this.state.eventType}
              onChange={this.handleEventTypeChange}
              fullWidth={true}
            >
              <MenuItem value="meeting" primaryText="Meeting" />
              <MenuItem value="personal" primaryText="Personal" />
              <MenuItem value="urgent" primaryText="Urgent" />
              <MenuItem value="other" primaryText="Other" />
            </SelectField>
            
            <TextField
              floatingLabelText="Description"
              value={this.state.desc}
              onChange={this.setDescription}
              multiLine={true}
              rows={2}
              fullWidth={true}
            />
            
            <div style={{ display: "flex", gap: "20px" }}>
              <TimePicker
                format="ampm"
                floatingLabelText="Start Time"
                minutesStep={15}
                value={this.state.start}
                onChange={this.handleStartTime}
                autoOk={true}
              />
              <TimePicker
                format="ampm"
                floatingLabelText="End Time"
                minutesStep={15}
                value={this.state.end}
                onChange={this.handleEndTime}
                autoOk={true}
              />
            </div>
          </div>
        </Dialog>

        <Snackbar
          open={this.state.showNotification}
          message={this.state.notificationMessage}
          autoHideDuration={3000}
          onRequestClose={() => this.setState({ showNotification: false })}
        />
      </div>
    );
  }
}

export default Calendar;