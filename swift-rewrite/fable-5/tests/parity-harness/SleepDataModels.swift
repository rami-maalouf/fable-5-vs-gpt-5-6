import Foundation
import SwiftData

// MARK: - Data Models
struct DailySleepData: Identifiable {
    let id = UUID()
    let dayLabel: String
    let date: Date
    let startOffset: Double  // Hours from base time (e.g. 18:00)
    let endOffset: Double  // Hours from base time
    let duration: TimeInterval
}

// MARK: - Sleep Data Utilities
@MainActor
struct SleepDataUtils {
    static let baseHour = 18.0
    private static let normalizedDayHour = 12

    // MARK: - Data Generation
    static func generateMockData() -> [DailySleepData] {
        // Generate last 7 days including today
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        var data: [DailySleepData] = []

        // Populate with mockup data for visualization if no sessions
        for i in 0..<7 {
            let date = calendar.date(byAdding: .day, value: -6 + i, to: today)!
            let weekday = calendar.component(.weekday, from: date)
            let dayLabel = calendar.shortWeekdaySymbols[weekday - 1]

            // Hacky mockup logic to demonstrate visualization:
            let sleepHour = Double.random(in: 22...25)  // 22(10pm) to 25(1am next day)
            let wakeHour = Double.random(in: 6...9)  // 6am to 9am

            // Convert chart hours relative to base 18:00
            let startOffset = sleepHour - baseHour
            let endOffset = (wakeHour + 24) - baseHour

            let duration = (endOffset - startOffset) * 3600

            data.append(
                DailySleepData(
                    dayLabel: dayLabel,
                    date: date,
                    startOffset: startOffset,
                    endOffset: endOffset,
                    duration: duration
                ))
        }

        return data
    }

    // MARK: - Data Processing
    static func process(sessions: [BlockedProfileSession]) -> [DailySleepData] {
        // Filter to completed sessions only (callers should pre-filter for isValidSession)
        let validSessions = sessions.filter { $0.endTime != nil }.sorted { $0.startTime < $1.startTime }
        guard
            let lastSession = validSessions.last,
            let anchorDate = normalizedSleepDayDate(for: lastSession)
        else {
            return []
        }

        var data: [DailySleepData] = []
        let calendar = Calendar.current

        var canonicalSessionByDay: [DateComponents: BlockedProfileSession] = [:]
        for session in validSessions {
            guard let dayKey = sleepDayComponents(for: session) else { continue }

            if let existing = canonicalSessionByDay[dayKey] {
                if session.duration > existing.duration {
                    canonicalSessionByDay[dayKey] = session
                }
            } else {
                canonicalSessionByDay[dayKey] = session
            }
        }

        // Generate last 7 days (k=6 down to 0)
        for i in (0..<7).reversed() {
            guard let targetDate = calendar.date(byAdding: .day, value: -i, to: anchorDate) else { continue }
            let targetDayKey = calendar.dateComponents([.year, .month, .day], from: targetDate)

            // Find existing session for this day (matching wake date)
            if let session = canonicalSessionByDay[targetDayKey],
               let end = session.endTime,
               let startOffset = calculateTimeOffset(
                for: session.startTime,
                timeZone: session.startTimeZone
               ),
               let endOffset = calculateTimeOffset(
                for: end,
                timeZone: session.endTimeZone
               ) {

                let duration = end.timeIntervalSince(session.startTime)
                let weekday = calendar.component(.weekday, from: targetDate)
                let dayLabel = calendar.shortWeekdaySymbols[weekday - 1]

                data.append(DailySleepData(
                    dayLabel: dayLabel,
                    date: targetDate,
                    startOffset: startOffset,
                    endOffset: endOffset,
                    duration: duration
                ))
            } else {
                // Formatting date for label if no session
                let weekday = calendar.component(.weekday, from: targetDate)
                let dayLabel = calendar.shortWeekdaySymbols[weekday - 1]

                // Empty Data Point
                data.append(DailySleepData(
                    dayLabel: dayLabel,
                    date: targetDate,
                    startOffset: 0, // 0 implies 18:00 base, but with 0 duration it shouldn't matter if we filter
                    endOffset: 0,
                    duration: 0
                ))
            }
        }

        return data
    }

    // MARK: - Calculations
    static func calculateYAxisDomain(data: [DailySleepData], optimalSleepTime: Date?, optimalWakeTime: Date?) -> (Double, Double) {
        // Filter out empty days (duration == 0) for domain calculation
        let activeData = data.filter { $0.duration > 0 }

        let startOffsets = activeData.map { $0.startOffset }
        let endOffsets = activeData.map { $0.endOffset }

        // Also consider optimal times
        var allValues = startOffsets + endOffsets
        if let optimalSleep = calculateTimeOffset(for: optimalSleepTime) {
            allValues.append(optimalSleep)
        }
        if let optimalWake = calculateTimeOffset(for: optimalWakeTime) {
            allValues.append(optimalWake)
        }

        // Default to typical sleep range: 10 PM to 8 AM
        // 10 PM = 22:00 = 4 hours after base (18:00)
        // 8 AM = 08:00 = 14 hours after base (18:00 + 14 = 32 - 24 = 8 AM next day)
        if allValues.isEmpty {
           return (4, 14)  // 10 PM to 8 AM
        }

        let minVal = allValues.min() ?? 0
        let maxVal = allValues.max() ?? 24

        // Tight padding (minVal, maxVal)
        return (minVal, maxVal)
    }

    static func calculateTimeOffset(for date: Date?, timeZone: TimeZone? = nil) -> Double? {
        guard let date = date else { return nil }
        var calendar = Calendar.current
        if let timeZone {
            calendar.timeZone = timeZone
        }
        let hour = calendar.component(.hour, from: date)
        let minute = calendar.component(.minute, from: date)

        let doubleHour = Double(hour) + Double(minute) / 60.0

        var adjustedHour = doubleHour
        if adjustedHour < baseHour {
            adjustedHour += 24
        }

        return adjustedHour - baseHour
    }

    static func calculateAverageDuration(for data: [DailySleepData]) -> TimeInterval {
        // Filter out empty days
        let activeData = data.filter { $0.duration > 0 }

        guard !activeData.isEmpty else { return 0 }
        let totalDuration = activeData.reduce(0) { $0 + $1.duration }
        return totalDuration / Double(activeData.count)
    }

    static func trackedDataPoints(from data: [DailySleepData]) -> [DailySleepData] {
        data.filter { $0.duration > 0 }
    }

    static func previousTrackedData(
        before date: Date,
        in data: [DailySleepData]
    ) -> DailySleepData? {
        trackedDataPoints(from: data).last { $0.date < date }
    }

    static func sleepDayComponents(for session: BlockedProfileSession) -> DateComponents? {
        guard let endTime = session.endTime else { return nil }
        return session.calendarForEndTime.dateComponents(
            [.year, .month, .day],
            from: endTime
        )
    }

    static func normalizedSleepDayDate(for session: BlockedProfileSession) -> Date? {
        guard let components = sleepDayComponents(for: session) else { return nil }
        return normalizedDayDate(from: components)
    }

    static func normalizedDayDate(from components: DateComponents) -> Date? {
        var normalized = DateComponents()
        normalized.year = components.year
        normalized.month = components.month
        normalized.day = components.day
        normalized.hour = normalizedDayHour
        return Calendar.current.date(from: normalized)
    }

    // MARK: - Scoring Logic
    static func calculateConsistency(data: [DailySleepData]) -> Int {
        // Keep generic implementation for backward compatibility if needed,
        // or repurpose as average of the two?
        // Let's just return average of sleep and wake consistency
        let sleep = calculateSleepConsistency(data: data)
        let wake = calculateWakeConsistency(data: data)
        return (sleep + wake) / 2
    }

    static func calculateSleepConsistency(data: [DailySleepData]) -> Int {
        let activeData = data.filter { $0.duration > 0 }
        return calculateConsistencyFor(values: activeData.map { $0.startOffset })
    }

    static func calculateWakeConsistency(data: [DailySleepData]) -> Int {
        let activeData = data.filter { $0.duration > 0 }
        return calculateConsistencyFor(values: activeData.map { $0.endOffset })
    }

    private static func calculateConsistencyFor(values: [Double]) -> Int {
        guard !values.isEmpty else { return 0 }
        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2.0) }.reduce(0, +) / Double(values.count)
        let stdDev = sqrt(variance) // in hours directly

        // -40 points per hour of deviation for stricter consistency scoring
        let deduction = Int(stdDev * 40)
        return max(0, 100 - deduction)
    }

    static func calculateAccuracy(data: [DailySleepData], optimalSleepTime: Date?, optimalWakeTime: Date?) -> Int {
        let activeData = data.filter { $0.duration > 0 }

        // Accuracy relative to sleepSettings.optimalSleepTime and optimalWakeTime
        guard !activeData.isEmpty,
              let targetSleep = calculateTimeOffset(for: optimalSleepTime),
              let targetWake = calculateTimeOffset(for: optimalWakeTime) else {
            return 0
        }

        var totalDeviation: Double = 0

        for day in activeData {
            let startDev = abs(day.startOffset - targetSleep)
            let endDev = abs(day.endOffset - targetWake)
            totalDeviation += (startDev + endDev)
        }

        let avgDeviation = totalDeviation / Double(activeData.count * 2) // Avg per event (sleep or wake)

        // Deduction: 1 hour off = 30 points for stricter accuracy scoring
        let deduction = Int(avgDeviation * 30)
        return max(0, 100 - deduction)
    }

    static func calculateStreak(sessions: [BlockedProfileSession]) -> Int {
        let calendar = Calendar.current
        let sortedSessions = sessions.sorted { $0.startTime > $1.startTime }

        // Get unique days that have at least one session (by wake date)
        var trackedDays = Set<Date>()
        for session in sortedSessions {
            guard let day = normalizedSleepDayDate(for: session) else { continue }
            trackedDays.insert(calendar.startOfDay(for: day))
        }

        // Check backwards from today/yesterday
        let today = calendar.startOfDay(for: Date())

        // If we haven't tracked today yet, check starting from yesterday
        // But if we HAVE tracked today, start from today
        var currentDay = today
        if !trackedDays.contains(today) {
            // Check if we tracked yesterday, if so, the streak is still alive
            if let yesterday = calendar.date(byAdding: .day, value: -1, to: today),
               trackedDays.contains(yesterday) {
                currentDay = yesterday
            } else {
                // No track today or yesterday = 0 streak
                return 0
            }
        }

        var streak = 0
        while trackedDays.contains(currentDay) {
            streak += 1
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: currentDay) else { break }
            currentDay = previousDay
        }

        return streak
    }

    // MARK: - Formatters
    static func formatAvgDuration(_ duration: TimeInterval) -> (hours: String, minutes: String) {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        return ("\(hours)", "\(minutes)")
    }

    static func formatTimeLabel(offset: Double) -> String {
        // offset 0 = 6 PM, 18 = 12 PM
        var hour = Int(baseHour + offset)
        if hour >= 24 { hour -= 24 }

        let ampm = hour >= 12 ? "PM" : "AM"
        let displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour)
        return "\(displayHour) \(ampm)"
    }

    static func formatDuration(_ duration: TimeInterval) -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: duration) ?? ""
    }

    static func formatDurationShort(_ duration: TimeInterval) -> String {
        let hours = Double(duration) / 3600.0
        return String(format: "%.1f", hours)
    }
}
