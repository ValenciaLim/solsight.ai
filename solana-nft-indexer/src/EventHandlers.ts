/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  NeonEVMPointsNFT,
  NeonEVMPointsNFT_Approval,
  NeonEVMPointsNFT_ApprovalForAll,
  NeonEVMPointsNFT_OwnershipTransferred,
  NeonEVMPointsNFT_Transfer,
} from "generated";

NeonEVMPointsNFT.Approval.handler(async ({ event, context }) => {
  const entity: NeonEVMPointsNFT_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    approved: event.params.approved,
    tokenId: event.params.tokenId,
  };

  context.NeonEVMPointsNFT_Approval.set(entity);
});

NeonEVMPointsNFT.ApprovalForAll.handler(async ({ event, context }) => {
  const entity: NeonEVMPointsNFT_ApprovalForAll = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    operator: event.params.operator,
    approved: event.params.approved,
  };

  context.NeonEVMPointsNFT_ApprovalForAll.set(entity);
});

NeonEVMPointsNFT.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: NeonEVMPointsNFT_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.NeonEVMPointsNFT_OwnershipTransferred.set(entity);
});

NeonEVMPointsNFT.Transfer.handler(async ({ event, context }) => {
  const entity: NeonEVMPointsNFT_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
  };

  context.NeonEVMPointsNFT_Transfer.set(entity);
});
