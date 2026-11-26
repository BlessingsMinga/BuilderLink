import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImagePickerAsset } from 'expo-image-picker';
import {
  addPortfolioPhoto,
  fetchBuilderDocuments,
  fetchPortfolio,
  removeBuilderDocument,
  removePortfolioPhoto,
  updatePortfolioPhoto,
  uploadBuilderDocument,
  type BuilderDocument,
  type DocumentType,
  type PhotoDetails,
  type PortfolioPhoto,
} from '../services/portfolio-service';

export function usePortfolio(builderId: string | undefined) {
  return useQuery<PortfolioPhoto[]>({
    queryKey: ['portfolio', builderId],
    queryFn: () => fetchPortfolio(builderId!),
    enabled: Boolean(builderId),
  });
}

export function useAddPortfolioPhoto(builderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ asset, details }: { asset: ImagePickerAsset; details: PhotoDetails }) => addPortfolioPhoto(builderId!, asset, details),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio', builderId] }),
  });
}

export function useUpdatePortfolioPhoto(builderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photo, details }: { photo: PortfolioPhoto; details: PhotoDetails }) => updatePortfolioPhoto(photo, details),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio', builderId] }),
  });
}

export function useRemovePortfolioPhoto(builderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: PortfolioPhoto) => removePortfolioPhoto(photo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio', builderId] }),
  });
}

export function useBuilderDocuments(builderId: string | undefined) {
  return useQuery<BuilderDocument[]>({
    queryKey: ['builder-documents', builderId],
    queryFn: () => fetchBuilderDocuments(builderId!),
    enabled: Boolean(builderId),
  });
}

export function useUploadBuilderDocument(builderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, asset }: { type: DocumentType; asset: ImagePickerAsset }) => uploadBuilderDocument(builderId!, type, asset),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder-documents', builderId] }),
  });
}

export function useRemoveBuilderDocument(builderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: BuilderDocument) => removeBuilderDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder-documents', builderId] }),
  });
}
