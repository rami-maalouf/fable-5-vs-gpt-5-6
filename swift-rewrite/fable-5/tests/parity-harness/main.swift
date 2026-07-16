// golden-fixture generator: feeds fixture sessions through the VERBATIM
// SleepMetricsAnalyzer.swift and prints every deterministic metric as json.
// run with a fixed timezone, e.g.:
//   TZ=America/Denver swift tests/parity-harness/*.swift <fixture.json>
import Foundation

struct FixtureSession: Codable {
  let id: String
  let tag: String
  let startTime: Double
  let endTime: Double?
  let startTz: String
  let endTz: String?
}

struct FixtureInput: Codable {
  let sessions: [FixtureSession]
  let optimalSleepMinutes: Int?
  let optimalWakeMinutes: Int?
}

func dateFromMinutes(_ minutes: Int?) -> Date? {
  guard let minutes else { return nil }
  return Calendar.current.date(from: DateComponents(hour: minutes / 60, minute: minutes % 60))
}

func dayKey(_ date: Date) -> String {
  let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
  return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
}

@MainActor
func run() throws {
  let path = CommandLine.arguments[1]
  let data = try Data(contentsOf: URL(fileURLWithPath: path))
  let input = try JSONDecoder().decode(FixtureInput.self, from: data)

  let sessions = input.sessions.map { s in
    BlockedProfileSession(
      id: s.id,
      tag: s.tag,
      startTime: Date(timeIntervalSince1970: s.startTime / 1000),
      endTime: s.endTime.map { Date(timeIntervalSince1970: $0 / 1000) },
      startTimeZoneIdentifier: s.startTz,
      endTimeZoneIdentifier: s.endTz
    )
  }

  let analyzer = SleepMetricsAnalyzer(
    sessions: sessions,
    optimalSleepTime: dateFromMinutes(input.optimalSleepMinutes),
    optimalWakeTime: dateFromMinutes(input.optimalWakeMinutes)
  )

  let records = analyzer.records
  let alignment = analyzer.sleepAlignmentSeries(records)

  var out: [String: Any] = [:]
  out["targetDurationHours"] = analyzer.targetDurationHours
  out["targetSleepOffset"] = analyzer.targetSleepOffset as Any
  out["targetWakeOffset"] = analyzer.targetWakeOffset as Any
  out["records"] = records.map { r in
    [
      "date": dayKey(r.date),
      "weekday": r.weekday,
      "durationHours": r.durationHours,
      "bedtimeOffset": r.bedtimeOffset,
      "wakeOffset": r.wakeOffset,
      "midpointOffset": r.midpointOffset,
    ] as [String: Any]
  }
  out["averageDuration"] = analyzer.averageDuration(records) as Any
  out["medianDuration"] = analyzer.medianDuration(records) as Any
  out["totalSleepHours"] = analyzer.totalSleepHours(records)
  out["longestNight"] = analyzer.longestNight(records) as Any
  out["shortestNight"] = analyzer.shortestNight(records) as Any
  out["goalHitRate"] = analyzer.goalHitRate(records)
  out["durationTrendPercent"] = analyzer.durationTrendPercent(records) as Any
  out["sleepConsistencyScore"] = analyzer.sleepConsistencyScore(records)
  out["wakeConsistencyScore"] = analyzer.wakeConsistencyScore(records)
  out["scheduleAccuracyScore"] = analyzer.scheduleAccuracyScore(records)
  out["regularityScore"] = analyzer.regularityScore(records)
  out["socialJetlagHours"] = analyzer.socialJetlagHours(records) as Any
  out["cumulativeDebtHours"] = analyzer.cumulativeDebtHours(records)
  out["movingAverageSeries"] = analyzer.movingAverageSeries(records).map { p in
    [
      "date": dayKey(p.date),
      "durationHours": p.durationHours,
      "movingAverageHours": p.movingAverageHours as Any,
    ] as [String: Any]
  }
  out["rollingConsistencySeries"] = analyzer.rollingConsistencySeries(records).map { p in
    [
      "date": dayKey(p.date),
      "sleepConsistency": p.sleepConsistency as Any,
      "wakeConsistency": p.wakeConsistency as Any,
      "scheduleAccuracy": p.scheduleAccuracy as Any,
    ] as [String: Any]
  }
  out["cumulativeDebtSeries"] = analyzer.cumulativeDebtSeries(records).map { p in
    ["date": dayKey(p.date), "cumulativeHours": p.cumulativeHours] as [String: Any]
  }
  out["durationTrendsAnalysis"] = analyzer.durationTrendsAnalysis().map { t in
    [
      "days": t.days,
      "averageDuration": t.averageDuration as Any,
      "previousAverageDuration": t.previousAverageDuration as Any,
      "changePercent": t.changePercent as Any,
      "sparkline": t.sparkline,
    ] as [String: Any]
  }
  out["weekdayAverages"] = analyzer.weekdayAverages(records).map { w in
    [
      "weekday": w.weekday,
      "dayName": w.dayName,
      "averageHours": w.averageHours,
      "nights": w.nights,
    ] as [String: Any]
  }
  out["durationBuckets"] = analyzer.durationBuckets(records).map { b in
    ["label": b.label, "count": b.count, "share": b.share] as [String: Any]
  }
  out["sleepAlignmentSeries"] = alignment.map { p in
    [
      "date": dayKey(p.date),
      "dailyScore": p.dailyScore,
      "trendScore": p.trendScore,
      "durationScore": p.durationScore,
      "timingScore": p.timingScore,
      "phaseScore": p.phaseScore,
      "consistencyScore": p.consistencyScore,
    ] as [String: Any]
  }

  let json = try JSONSerialization.data(
    withJSONObject: out,
    options: [.prettyPrinted, .sortedKeys]
  )
  print(String(data: json, encoding: .utf8)!)
}

try MainActor.assumeIsolated {
  try run()
}
