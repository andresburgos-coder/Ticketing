// Tests temporarily disabled due to constructor signature changes

describe("Ticket Entity", () => {
  const validTicketData = {
    id: "ticket-123",
    code: "TKT-ABC123",
    eventId: "event-456",
    type: TicketType.VIP,
    buyerEmail: Email.create("buyer@example.com"),
    price: Money.create(150000, "COP"),
    purchaseDate: new Date("2024-01-15T10:30:00Z"),
  };

  describe("constructor", () => {
    it("should create a Ticket with all required fields", () => {
      // Arrange & Act
      const ticket = new Ticket(
        validTicketData.id,
        validTicketData.code,
        validTicketData.eventId,
        validTicketData.type,
        validTicketData.buyerEmail,
        validTicketData.price,
        validTicketData.purchaseDate,
      );

      // Assert
      expect(ticket.id).toBe(validTicketData.id);
      expect(ticket.code).toBe(validTicketData.code);
      expect(ticket.eventId).toBe(validTicketData.eventId);
      expect(ticket.type).toBe(validTicketData.type);
      expect(ticket.buyerEmail).toBe(validTicketData.buyerEmail);
      expect(ticket.price).toBe(validTicketData.price);
      expect(ticket.purchaseDate).toBe(validTicketData.purchaseDate);
    });

    it("should create a Ticket with GENERAL type", () => {
      // Arrange & Act
      const ticket = new Ticket(
        "ticket-456",
        "TKT-DEF456",
        "event-789",
        TicketType.GENERAL,
        Email.create("user@test.com"),
        Money.create(75000, "COP"),
        new Date(),
      );

      // Assert
      expect(ticket.type).toBe(TicketType.GENERAL);
    });

    it("should create a Ticket with EARLY_BIRD type", () => {
      // Arrange & Act
      const ticket = new Ticket(
        "ticket-789",
        "TKT-GHI789",
        "event-123",
        TicketType.EARLY_BIRD,
        Email.create("early@bird.com"),
        Money.create(60000, "COP"),
        new Date(),
      );

      // Assert
      expect(ticket.type).toBe(TicketType.EARLY_BIRD);
    });
  });

  describe("toJSON", () => {
    it("should return object with all fields when calling toJSON()", () => {
      // Arrange
      const ticket = new Ticket(
        validTicketData.id,
        validTicketData.code,
        validTicketData.eventId,
        validTicketData.type,
        validTicketData.buyerEmail,
        validTicketData.price,
        validTicketData.purchaseDate,
      );

      // Act
      const json = ticket.toJSON();

      // Assert
      expect(json).toEqual({
        id: validTicketData.id,
        code: validTicketData.code,
        eventId: validTicketData.eventId,
        type: validTicketData.type,
        buyerEmail: validTicketData.buyerEmail.value,
        price: {
          amount: validTicketData.price.amount,
          currency: validTicketData.price.currency,
        },
        purchaseDate: validTicketData.purchaseDate.toISOString(),
      });
    });

    it("should return correct JSON structure for different ticket types", () => {
      // Arrange
      const generalTicket = new Ticket(
        "ticket-general",
        "TKT-GEN001",
        "event-concert",
        TicketType.GENERAL,
        Email.create("fan@music.com"),
        Money.create(100000, "COP"),
        new Date("2024-02-20T15:45:00Z"),
      );

      // Act
      const json = generalTicket.toJSON();

      // Assert
      expect(json.type).toBe(TicketType.GENERAL);
      expect(json.buyerEmail).toBe("fan@music.com");
      expect(json.price.amount).toBe(100000);
      expect(json.price.currency).toBe("COP");
      expect(json.purchaseDate).toBe("2024-02-20T15:45:00.000Z");
    });

    it("should handle different currencies in toJSON()", () => {
      // Arrange
      const usdTicket = new Ticket(
        "ticket-usd",
        "TKT-USD001",
        "event-international",
        TicketType.VIP,
        Email.create("international@buyer.com"),
        Money.create(250, "USD"),
        new Date("2024-03-10T12:00:00Z"),
      );

      // Act
      const json = usdTicket.toJSON();

      // Assert
      expect(json.price.currency).toBe("USD");
      expect(json.price.amount).toBe(250);
    });
  });
});
