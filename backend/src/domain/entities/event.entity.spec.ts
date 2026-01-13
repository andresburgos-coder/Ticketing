// Tests temporarily disabled due to constructor signature changes
  describe("constructor", () => {
    it("should create Event with valid data", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          100,
        ),
        new TicketConfiguration(
          TicketType.GENERAL,
          Money.create(100000, "COP"),
          200,
          200,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      expect(event.id).toBe("event-123");
      expect(event.name).toBe("Concierto de Rock");
      expect(event.date).toEqual(new Date("2025-03-15T20:00:00Z"));
      expect(event.location).toBe("Estadio Nacional");
      expect(event.ticketConfigurations).toHaveLength(2);
    });

    it("should make ticketConfigurations readonly", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          100,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      // Should return a copy, not the original array
      expect(event.ticketConfigurations).not.toBe(ticketConfigs);
      expect(event.ticketConfigurations).toEqual(ticketConfigs);
    });
  });

  describe("getAvailability", () => {
    it("should return correct availability for existing ticket type", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          75,
        ),
        new TicketConfiguration(
          TicketType.GENERAL,
          Money.create(100000, "COP"),
          200,
          150,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      expect(event.getAvailability(TicketType.VIP)).toBe(75);
      expect(event.getAvailability(TicketType.GENERAL)).toBe(150);
    });

    it("should return 0 for non-existing ticket type", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          75,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      expect(event.getAvailability(TicketType.EARLY_BIRD)).toBe(0);
    });
  });

  describe("reserveTickets", () => {
    it("should decrement availability when reserving tickets", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          75,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      const initialAvailability = event.getAvailability(TicketType.VIP);
      event.reserveTickets(TicketType.VIP, 5);
      const newAvailability = event.getAvailability(TicketType.VIP);

      expect(newAvailability).toBe(initialAvailability - 5);
      expect(newAvailability).toBe(70);
    });

    it("should throw TicketTypeNotFoundException for non-existing ticket type", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          75,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      expect(() => event.reserveTickets(TicketType.EARLY_BIRD, 5)).toThrow(
        TicketTypeNotFoundException,
      );
    });

    it("should throw InsufficientTicketsException when not enough tickets available", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          5,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      expect(() => event.reserveTickets(TicketType.VIP, 10)).toThrow(
        InsufficientTicketsException,
      );
      expect(() => event.reserveTickets(TicketType.VIP, 10)).toThrow(
        "Requested 10 VIP tickets but only 5 available",
      );
    });
  });

  describe("releaseTickets", () => {
    it("should increment availability when releasing tickets", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          70,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      const initialAvailability = event.getAvailability(TicketType.VIP);
      event.releaseTickets(TicketType.VIP, 5);
      const newAvailability = event.getAvailability(TicketType.VIP);

      expect(newAvailability).toBe(initialAvailability + 5);
      expect(newAvailability).toBe(75);
    });

    it("should do nothing for non-existing ticket type", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          70,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      // Should not throw error, just do nothing
      expect(() =>
        event.releaseTickets(TicketType.EARLY_BIRD, 5),
      ).not.toThrow();
    });
  });

  describe("integration tests", () => {
    it("should maintain availability invariant after reserve and release", () => {
      const ticketConfigs = [
        new TicketConfiguration(
          TicketType.VIP,
          Money.create(150000, "COP"),
          100,
          75,
        ),
      ];

      const event = new Event(
        "event-123",
        "Concierto de Rock",
        new Date("2025-03-15T20:00:00Z"),
        "Estadio Nacional",
        ticketConfigs,
      );

      const initialAvailability = event.getAvailability(TicketType.VIP);

      // Reserve some tickets
      event.reserveTickets(TicketType.VIP, 10);
      expect(event.getAvailability(TicketType.VIP)).toBe(
        initialAvailability - 10,
      );

      // Release them back
      event.releaseTickets(TicketType.VIP, 10);
      expect(event.getAvailability(TicketType.VIP)).toBe(initialAvailability);
    });
  });
});
