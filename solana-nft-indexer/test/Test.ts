import assert from "assert";
import { 
  TestHelpers,
  NeonEVMPointsNFT_Approval
} from "generated";
const { MockDb, NeonEVMPointsNFT } = TestHelpers;

describe("NeonEVMPointsNFT contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for NeonEVMPointsNFT contract Approval event
  const event = NeonEVMPointsNFT.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("NeonEVMPointsNFT_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await NeonEVMPointsNFT.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualNeonEVMPointsNFTApproval = mockDbUpdated.entities.NeonEVMPointsNFT_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedNeonEVMPointsNFTApproval: NeonEVMPointsNFT_Approval = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      approved: event.params.approved,
      tokenId: event.params.tokenId,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualNeonEVMPointsNFTApproval, expectedNeonEVMPointsNFTApproval, "Actual NeonEVMPointsNFTApproval should be the same as the expectedNeonEVMPointsNFTApproval");
  });
});
