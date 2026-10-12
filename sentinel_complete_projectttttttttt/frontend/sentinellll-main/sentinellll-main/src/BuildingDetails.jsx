
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  Droplets,
  Zap,
  Leaf,
  Search,
} from "lucide-react";
import { buildings } from "./data/demoData.js";
import { roomData } from "./data/roomData.js";
import "./BuildingDetails.css";

export default function BuildingDetails() {
  const params = new URLSearchParams(window.location.search);
  const initialBuilding = params.get("name") || buildings[0];

  const [building, setBuilding] = useState(
    buildings.includes(initialBuilding) ? initialBuilding : buildings[0]
  );
  const [search, setSearch] = useState("");
  const [roomType, setRoomType] = useState("All");

  const rooms = roomData[building] || [];
  const types = ["All", ...new Set(rooms.map((room) => room.type))];

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = roomType === "All" || room.type === roomType;
    return matchesSearch && matchesType;
  });

  return (
    <main className="building-page">
      <header className="building-topbar">
        <button
          className="back-button"
          onClick={() => (window.location.href = "/dashboard")}
        >
          <ArrowLeft size={18} /> Back to dashboard
        </button>
        <span className="demo-label">DEMO DATA</span>
      </header>

      <section className="building-heading">
        <div className="building-heading-icon">
          <Building2 size={30} />
        </div>
        <p className="eyebrow">CAMPUS DIRECTORY</p>
        <h1>Building details</h1>
        <p>Explore rooms and resource information across campus.</p>

        <select
          value={building}
          onChange={(event) => {
            setBuilding(event.target.value);
            setSearch("");
            setRoomType("All");
          }}
          aria-label="Select building"
        >
          {buildings.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      <section className="building-stats">
        <article className="building-stat">
          <DoorOpen />
          <span>Total listed spaces</span>
          <strong>{rooms.length}</strong>
        </article>
        <article className="building-stat">
          <Zap />
          <span>Electricity</span>
          <strong>Demo reading</strong>
        </article>
        <article className="building-stat">
          <Droplets />
          <span>Water</span>
          <strong>Demo reading</strong>
        </article>
        <article className="building-stat">
          <Leaf />
          <span>Carbon</span>
          <strong>Demo estimate</strong>
        </article>
      </section>

      <section className="rooms-section">
        <div className="rooms-title">
          <div>
            <p className="eyebrow">SPACE DIRECTORY</p>
            <h2>{building}</h2>
          </div>
          <span>{filteredRooms.length} spaces</span>
        </div>

        <div className="room-filters">
          <label className="room-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rooms..."
            />
          </label>

          <select
            value={roomType}
            onChange={(event) => setRoomType(event.target.value)}
            aria-label="Filter by room type"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All space types" : type}
              </option>
            ))}
          </select>
        </div>

        <div className="rooms-grid">
          {filteredRooms.map((room) => (
            <article className="room-card" key={room.name}>
              <div className="room-card-icon">
                <DoorOpen size={21} />
              </div>
              <div>
                <h3>{room.name}</h3>
                <p>{room.type}</p>
                <span>{room.floor}</span>
              </div>
            </article>
          ))}

          {filteredRooms.length === 0 && (
            <p className="no-rooms">
              No spaces match your search. Try another name or type.
            </p>
          )}
        </div>

        <div className="map-placeholder">
          <Building2 size={24} />
          <div>
            <h3>Building map integration</h3>
            <p>
              Reserved for the campus map, room locations, and live resource
              data when the backend and map service are connected.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
