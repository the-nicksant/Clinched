"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Trophy } from "lucide-react";

export default function Home() {
  const upcomingEvents = useQuery(api.functions.events.getUpcoming);
  const completedEvents = useQuery(api.functions.events.getCompleted, {
    limit: 5,
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-2xl border border-cyan-900/30 bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-center backdrop-blur">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to Clinched
        </h1>
        <p className="mt-3 text-lg text-cyan-400">
          Build your dream MMA roster, pick your fighters, and compete for glory.
        </p>
      </section>

      {/* Upcoming Events */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-cyan-400" />
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Upcoming Events
          </h2>
        </div>
        {upcomingEvents === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg bg-zinc-800/50"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-12 text-center">
            <p className="text-zinc-500">No upcoming events scheduled.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Link key={event._id} href={`/events/${event._id}`}>
                <div className="group overflow-hidden rounded-lg border border-cyan-900/30 bg-zinc-900/50 backdrop-blur transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {event.name}
                      </h3>
                      <Badge className="bg-gradient-to-r from-cyan-600 to-blue-600">
                        Upcoming
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-cyan-500" />
                        <span>{format(new Date(event.eventDate), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Results */}
      {completedEvents && completedEvents.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Recent Results
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedEvents.map((event) => (
              <Link key={event._id} href={`/events/${event._id}`}>
                <div className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur transition-all hover:border-zinc-700 hover:shadow-lg">
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="text-lg font-bold text-white">
                        {event.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-zinc-700 text-zinc-400"
                      >
                        Completed
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{format(new Date(event.eventDate), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
