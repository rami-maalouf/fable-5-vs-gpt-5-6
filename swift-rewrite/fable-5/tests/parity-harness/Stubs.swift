// minimal stand-in for Models/BlockedProfileSessions.swift so the verbatim
// analyzer sources compile outside the app. mirrors the exact computed
// properties the analyzer and SleepDataUtils consume.
import Foundation

final class BlockedProfileSession {
  let id: String
  let tag: String
  var startTime: Date
  var endTime: Date?
  var startTimeZoneIdentifier: String?
  var endTimeZoneIdentifier: String?

  init(
    id: String,
    tag: String,
    startTime: Date,
    endTime: Date?,
    startTimeZoneIdentifier: String?,
    endTimeZoneIdentifier: String?
  ) {
    self.id = id
    self.tag = tag
    self.startTime = startTime
    self.endTime = endTime
    self.startTimeZoneIdentifier = startTimeZoneIdentifier
    self.endTimeZoneIdentifier = endTimeZoneIdentifier
  }

  static let minimumDuration: TimeInterval = 5 * 60

  var duration: TimeInterval {
    let end = endTime ?? Date()
    return end.timeIntervalSince(startTime)
  }

  var isValidSession: Bool {
    return duration >= BlockedProfileSession.minimumDuration
  }

  var sleepDate: Date {
    let calendar = calendarForEndTime
    guard let endTime = endTime else {
      return calendar.startOfDay(
        for: calendar.date(byAdding: .day, value: 1, to: startTime) ?? startTime
      )
    }
    return calendar.startOfDay(for: endTime)
  }

  var startTimeZone: TimeZone {
    return resolvedTimeZone(startTimeZoneIdentifier) ?? .current
  }

  var endTimeZone: TimeZone {
    return resolvedTimeZone(endTimeZoneIdentifier) ?? startTimeZone
  }

  var calendarForStartTime: Calendar {
    calendar(in: startTimeZone)
  }

  var calendarForEndTime: Calendar {
    calendar(in: endTimeZone)
  }

  private func resolvedTimeZone(_ identifier: String?) -> TimeZone? {
    guard let identifier else { return nil }
    return TimeZone(identifier: identifier)
  }

  private func calendar(in timeZone: TimeZone) -> Calendar {
    var calendar = Calendar.current
    calendar.timeZone = timeZone
    return calendar
  }
}
